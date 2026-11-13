window.PORTFOLIO = {
  references: [{ url: 'http://192.168.178.51:3810/', previewManifest: 'assets/minenachten-preview/manifest-v3.json' }, null, null, null],
  text: /^de(?:-|$)/i.test(navigator.language || '')
    ? 'Hi, das ist das Portfolio von NicoM701 mit ausgewählten Arbeiten und ein paar persönlichen Dingen, die ich nutze und mag'
    : 'Hi, this is NicoM701 portfolio and selected work references and some personal items i use and like',
  frames: {
    desktop: { src: 'assets/device-frames/desktop.png', screen: [5.0573,4.06945,91.8611,64.1942], viewport: 1440 },
    phone: { src: 'assets/device-frames/phone.png', screen: [3.1856,6.88705,86.2259,93.6288], viewport: 390 }
  }
};
