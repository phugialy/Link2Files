module.exports = {
  packagerConfig: {
    asar: true,
    icon: './assets/icon',
    ignore: [
      /^\/src/,
      /^\/electron/,
      /^\/node_modules/,
      /^\/vite.config.ts/
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
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
}; 