import Fimod from '../fimod';

const shortcuts = {
  69: { performAction: function() { Click("transportLine"); } },                       // e
  70: { performAction: function() { Toggle("playNormalButton", "playFastButton"); } }, // f
  82: { performAction: function() { Toggle("playButton", "stopButton"); } }            // r
};

function Click(element) {
  $('[data-id="' + element + '"]').click();
}

function Toggle(element1, element2) {
  if (document.getElementById(element2).style.display === 'none') {
    document.getElementById(element1).click();
  } else {
    document.getElementById(element2).click();
  }
}

Fimod.define({
  name: "keyboardshortcuts",
  label: "Keyboard Shortcuts",
  description: "Keyboard shortcuts that provide easy access to modules and buttons",
},
['ui/factory/mapLayers/MouseLayer'],
(MouseLayer) => {

  Fimod.wrap(MouseLayer, 'display', function(supr, ...args) {
    supr(...args);

    this.setupKeyboardShortcutsListener();
  });

  MouseLayer.prototype.setupKeyboardShortcutsListener = function() {
    this._handleKeyboardShortcuts = (event) => {
      if (event.keyCode in shortcuts) shortcuts[event.keyCode].performAction();
    };

    document.body.addEventListener("keyup", this._handleKeyboardShortcuts);
  };

  Fimod.wrap(MouseLayer, 'destroy', function(supr) {
    supr();

    document.body.removeEventListener("keyup", this._handleKeyboardShortcuts);
  });
});
