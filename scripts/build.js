const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist', 'youtube-danmaku.user.js');

const MODULES = [
  'userscript-header.js',
  'i18n.js',
  'config.js',
  'storage.js',
  'utils/dom.js',
  'ui/styles.js',
  'ui/icons.js',
  'danmaku/lanes.js',
  'speech/speaker.js',
  'danmaku/engine.js',
  'danmaku/interaction.js',
  'danmaku/emitter.js',
  'translate/dictionary.js',
  'translate/translator.js',
  'translate/phrases.js',
  'translate/queue.js',
  'chat/dedupe.js',
  'chat/parser.js',
  'chat/chat-translate.js',
  'chat/channel.js',
  'chat/send-message.js',
  'chat/favorites.js',
  'chat/actions.js',
  'chat/observer.js',
  'chat/history.js',
  'live/viewers.js',
  'ui/panel.js',
  'ui/speech-panel.js',
  'ui/history-panel.js',
  'ui/favorites-panel.js',
  'ui/chat-clear-button.js',
  'ui/chat-collapse-button.js',
  'ui/fullscreen-chat.js',
  'ui/control-button.js',
  'ui/live-viewers.js',
  'main.js',
];


function build() {
  const headerPath = path.join(SRC, 'userscript-header.js');
  const header = fs.readFileSync(headerPath, 'utf8').trim();

  const bodyParts = MODULES
    .filter((file) => file !== 'userscript-header.js')
    .map((file) => {
      const fullPath = path.join(SRC, file);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Missing source file: ${file}`);
      }
      return fs.readFileSync(fullPath, 'utf8').trim();
    });

  const banner = `(function () {
'use strict';
`;

  const footer = `
})();`;

  const output = `${header}\n\n${banner}${bodyParts.join('\n\n')}${footer}\n`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, output, 'utf8');
  console.log(`Built ${OUT} (${(output.length / 1024).toFixed(1)} KB)`);
}

build();

if (process.argv.includes('--watch')) {
  console.log('Watching for changes...');
  fs.watch(SRC, { recursive: true }, () => {
    try {
      build();
    } catch (err) {
      console.error(err.message);
    }
  });
}
