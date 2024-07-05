
const body_editor = CodeMirror.fromTextArea(document.getElementById("raw_request_body_data"), {
  theme: "monokai",
  extraKeys: {"Ctrl-Space": "autocomplete", },
  mode: {name: "application/ld+json", globalVars: true},
  gutters: ["CodeMirror-lint-markers"],
  lineNumbers: true,
  lineWrapping: true,
  autoIndent: true,
  autoCloseBrackets: true,
  autocomplete :true,
  hint : true,
  plaecholder : "Request body goes in here"
});


const response_editor = CodeMirror.fromTextArea(document.getElementById("pretty_response_body_data"), {
    theme: "monokai",
    extraKeys: {"Ctrl-Space": "autocomplete", },
    mode: {name: "application/ld+json", globalVars: true},
    gutters: ["CodeMirror-lint-markers"],
    lineNumbers: true,
    lineWrapping: true,
    autoIndent: true,
    autoCloseBrackets: true,
    autocomplete :true,
    hint : true,
    plaecholder : "Request body goes in here",
    readonlly: true
  });
  


body_editor.setSize("100%", "100%");
response_editor.setSize("100%", "100%");


exports = {
  body_editor,
  response_editor
}


console.log(
  "ediors",
  body_editor,
  response_editor)