const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');
const { AutoUnpackNativesPlugin } = require('@electron-forge/plugin-auto-unpack-natives');
const fs = require('fs-extra'); // Need fs-extra for recursive copy, or use standard fs with cpSync in Node 16.7+
const path = require('path');

module.exports = {
  packagerConfig: {
    asar: {
      unpack: '**/node_modules/better-sqlite3/**/*'
    },
  },

  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      console.log('🔴 Hook: Manually copying native modules...');

      const srcNodeModules = path.join(__dirname, 'node_modules');
      const destNodeModules = path.join(buildPath, 'node_modules');

      // Ensure destination exists
      if (!fs.existsSync(destNodeModules)) {
        fs.mkdirSync(destNodeModules, { recursive: true });
      }

      const modulesToCopy = ['better-sqlite3', 'bindings', 'file-uri-to-path'];

      for (const mod of modulesToCopy) {
        const src = path.join(srcNodeModules, mod);
        const dest = path.join(destNodeModules, mod);

        if (fs.existsSync(src)) {
          console.log(`  - Copying ${mod} to build path...`);
          try {
            // Using cpSync which is available in newer Node versions, or fallback to simple copy
            fs.cpSync(src, dest, { recursive: true, force: true });
          } catch (e) {
            console.error(`  ❌ Failed to copy ${mod}:`, e);
          }
        } else {
          console.warn(`  ⚠️ Source module ${mod} not found in ${srcNodeModules}`);
        }
      }
      console.log('🟢 Hook sequence complete.');
    }
  },

  rebuildConfig: {
    onlyModules: [], // Already rebuilt manually using electron-rebuild
  },

  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        iconUrl: 'https://raw.githubusercontent.com/Juan100205/Sistema-de-Gestion-Residencial/main/assets/Logo.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main.js',
            config: 'vite.main.config.mjs',
            target: 'main',
          },
          {
            entry: 'src/preload.js',
            config: 'vite.preload.config.mjs',
            target: 'preload',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.mjs',
          },
        ],
      },
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
