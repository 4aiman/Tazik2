const app = {} // this is the app, it'll contain every possible thing about the app
app.invoke = window?.__TAURI__?.core?.invoke
app.fetch = window?.__TAURI__?.http?.fetch //|| fetch.bind(window)
app.clipboard = window?.__TAURI__?.clipboardManager
app.fileExists = window?.__TAURI__?.fs?.exists
app.readTextFile = window?.__TAURI__?.fs?.readTextFile
app.writeTextFile = window?.__TAURI__?.fs?.writeTextFile
app.process = window?.__TAURI__?.process
app.version = window?.__TAURI__?.app?.getVersion()
app.name = window?.__TAURI__?.app?.getName()
app.tversion = window?.__TAURI__?.app?.getTauriVersion()
app.platform = window?.__TAURI__?.os?.platform()
app.arch = window?.__TAURI__?.os?.arch()
app.open_dialog = window?.__TAURI__?.dialog?.open
app.save_dialog = window?.__TAURI__?.dialog?.save
app.opened_tabs = []
app.collections = []
app.environments = []
app.tab_history = []
app.request_history = []
app.current_request

let greetInputEl;
let greetMsgEl;
let scrollbar_fix = '<style> \
::-webkit-scrollbar { \
  width: 6pt; \
  height: 6pt; \
  border-radius: 5pt; \
} \
::-webkit-scrollbar-track { \
  background: #111; \
  border-radius: 5pt; \
} \
::-webkit-scrollbar-thumb { \
  background: #888; \
  border-radius: 5pt; \
} \
::-webkit-scrollbar-thumb:hover { \
  background: #655; \
  border-radius: 5pt; \
} </style>'

async function greet() {
  // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
  greetMsgEl.textContent = await app.invoke("greet", { name: greetInputEl.value });
}





// window.addEventListener("DOMContentLoaded", () => {
//   greetInputEl = document.querySelector("#greet-input");
//   greetMsgEl = document.querySelector("#greet-msg");
//   document.querySelector("#greet-form").addEventListener("submit", (e) => {
//     e.preventDefault();
//     greet();
//   });
// });



console.log(app)
console.log(window?.__TAURI__)


function fetchStream(stream) {
  const reader = stream.getReader();
  let charsReceived = 0;
  let result = ''
  // read() returns a promise that resolves
  // when a value has been received
  reader.read().then(function processText({ done, value }) {
    // Result objects contain two properties:
    // done  - true if the stream has already given you all its data.
    // value - some data. Always undefined when done is true.
    if (done) {
      console.log("Stream complete");
      return;
    }

    // value for fetch streams is a Uint8Array
    charsReceived += value.length;
    const chunk = value;
    result += chunk;

    // Read some more, and call this function again
    return reader.read().then(processText);
  });
}

function build_request_url(){
  let url_input = document.getElementById('url_input')
  let full_url = url_input.value
  let request_params_table = document.getElementById("query_params_table")
  let inputs = request_params_table.getElementsByTagName("input")
  let result = []
  let [url, params] = full_url.split("?")

  let param_count = 0
  if (params && params != "") {
    let split_params = params.split("&")
    for (let param of split_params) {
      param_count = param_count + 1
      let [key, value] = param.split("=")
      add_row(null, request_params_table, {on: true, key: key, value: value, enabled: true, prevent_addition_of_a_new_row:(split_params.length != param_count)}) 
    }
  }

  
  for (let i = 0; i< inputs.length/5; i++) {    
    let key         = inputs[(i*5)+1].value
    let value       = inputs[(i*5)+2].value
    let description = inputs[(i*5)+3].value
    let delete_butt = inputs[(i*5)+4]
    
    if (!(key || value || description)) {
      if (window.getComputedStyle(delete_butt).display != "none") {
        delete_row(null, inputs[(i*5)])
      }      
    }
  }


  if (~url.indexOf("http://") || ~url.indexOf("https://")) {    
  } else {
    url = "https://"+url
  }
  url_input.value = url

  if (result.length > 0)  {
    url = url + "?" + result.join("&")
  }  
  
  console.log("ret", url)
  return url
}

function request_table_to_json(table_name) {  
  console.log("request_table_to_json",table_name)
  let table = document.getElementById(table_name)
  let inputs = table.getElementsByTagName("input")
  for (let i = 0; i< inputs.length/5; i++) {
      console.log(i, inputs[i].value)
  }
  let result = []
  for (let i = 0; i< inputs.length/5; i++) {
    let on      = inputs[(i*5)].checked
    let key     = inputs[(i*5)+1].value
    let value   = inputs[(i*5)+2].value
    let desc    = inputs[(i*5)+3].value
    let enabled = (window.getComputedStyle(inputs[(i*5)+4]).display != "none")
    console.log('adding from ' + table_name, on || '-', key || '-', value || '-', desc || '-', enabled || '-')
    let counter = 0
    //if (enabled) { // ignore the last row w/o visible button
      //if (key && value) {
          counter = counter + 1
          // save the checkbox, key, value, and description          
          result.push({key: key, enabled: enabled, on: on, value : value || "", description: desc || ""})
      //}
    //}
  }
  return result
}

function build_request_params() {
  return request_table_to_json("query_params_table")
}


function build_request_headers() {
  return request_table_to_json("headers_table")
}


async function read_file_synchronyously(file) {
  let result = await new Promise((resolve) => {
      let reader = new FileReader();
      reader.onload = (e) => resolve(reader.result);
      reader.readAsArrayBuffer(file);
  });

  console.log(result); 
  return result;
}

async function build_request() { 
  console.log("==== START BUILDING REQUEST ====")
  let raw_request_body_data = document.getElementById('raw_request_body_data')
  let response_area = document.getElementById('response_body')
  let method = document.getElementById('metod_select').getAttribute('value')  
  let auth_type = document.getElementById('auth_type_select').value
  let auth_panel =  document.getElementById('auth_panel_'+auth_type)
  let auth_inputs = auth_panel.getElementsByClassName("auth_input")


  let result = {}

  result.url          = build_request_url()
  result.base_url     = result.url.split("?")[0]
  result.timeout      = 30
  result.headers      = build_request_headers()
  result.method       = method
  result.auth_type    = auth_type
  result.query_params = build_request_params()

  // save ALL auth data in the query
  result.auth = {}

  let auth_right_side = document.getElementById('auth_right_side')
  let panels = auth_right_side.getElementsByClassName("tabpanel")
  let current_panel_id = "auth_panel_" + result.auth_type

  for (let panel of panels) {
    let auth_inputs = panel.getElementsByClassName("auth_input")    
    let panel_auth_type = panel.id.split("_")[2] //auth _ panel _ *basic*
    console.log("panel.id",panel.id, panel_auth_type)
    result.auth[panel_auth_type] = {} 
    for (let input of auth_inputs) {
      if (input.classList.contains("username_input")) {
        result.auth[panel_auth_type].username = input.value
        if (panel.id == current_panel_id) {
          //result.username = input.value
        }
      }
      if (input.classList.contains("password_input")) {
        result.auth[panel_auth_type].password = input.value
        if (panel.id == current_panel_id) {
          //result.password = input.value
        }
      }
      if (input.classList.contains("domain_input")) {
        result.auth[panel_auth_type].domain = input.value
        if (panel.id == current_panel_id) {
          //result.domain = input.value
        }
      }
      if (input.classList.contains("workstation_input")) {
        result.auth[panel_auth_type].workstation = input.value
        if (panel.id == current_panel_id) {
          //result.workstation = input.value
        }
      }
      if (input.classList.contains("token_input")) {
        result.auth[panel_auth_type].token = input.value
        if (panel.id == current_panel_id) {
          //result.token = input.value
        }
      }      
    }
  }
  

  // process body
  result.body_data = {}
  let request_body_tabbar = document.getElementById('request_body_tabbar')
  let radios = request_body_tabbar.getElementsByClassName('tab_header_button')
  let body_type = "none"
  for (let radio of radios) {
    if (radio.checked) {
      body_type = radio.value
      break
    }
  }

  result.body_type = body_type


  let request_b_data = document.getElementById("request_b_data")
  let tabs = request_b_data.getElementsByClassName("tabpanel")
  let body_binary_file_input = document.getElementById('body_binary_file_input')
  let body_binary_file = body_binary_file_input.getAttribute("filename") 

  result.body_data["form-data"]             = request_table_to_json("form-data_table")
  result.body_data["x-www-form-urlencoded"] = request_table_to_json("x-www-form-urlencoded_table")
  result.body_data["raw"]                   = body_editor.getValue()
  // binary data itself won't be saved/loaded by deafult, as this project isn't about sharing files
  result.body_data["binary"]                = {filename: body_binary_file, data: null}
  
  // needs adjustments
  let body_mime_type_select = document.getElementById("body_mime_type_select")
  switch(body_mime_type_select.value) {
    case "text": 
      result.body_mime_type = "text/plain"
    break
    case "javascript": 
      result.body_mime_type = "text/javascript"
    break
    case "html": 
      result.body_mime_type = "text/html"
    break
    case "xml": 
      result.body_mime_type = "application/xml"
    break
    case "application/ld+json": 
      result.body_mime_type = "application/json"
    break
    default:
      result.body_mime_type = "text/plain"
    break
  }
   

  console.log("request built ", result)

  console.log("==== FINISH BUILDING REQUEST ===")
  return result
}

function add_content_type_header(value) {
  let headers_table = document.getElementById("headers_table")
  let inputs = headers_table.getElementsByTagName("input")
  
  let found 
  for (let i = 0; i< inputs.length/5; i++) {
    let key = inputs[(i*5)+1].value
    if (key == 'Content-Type') {
      found = true // don't care about the value, but if it catches something in 0th row then `if (!found)` equals to true (0 is falsy)
      break
    }
  }

  
  let content_type = value

  switch(value) {
    case "text": 
      content_type = "text/plain"
    break
    case "javascript": 
      content_type = "text/javascript"
    break
    case "html": 
      content_type = "text/html"
    break
    case "xml": 
      content_type = "application/xml"
    break
    case "application/ld+json": 
      content_type = "application/json"
    break
    default:
      content_type = value || "text/plain"
    break
  }

  if (!found) {
    add_row(null, headers_table, {on: true, key: 'Content-Type', value: content_type, description:"Set automatically, according to body type", enabled: true}) 
  }

  for (let i = 0; i< inputs.length/5; i++) {    
    let key         = inputs[(i*5)+1].value
    let value       = inputs[(i*5)+2].value
    let description = inputs[(i*5)+3].value
    let delete_butt = inputs[(i*5)+4]
    
    if (!(key || value || description)) {
      if (window.getComputedStyle(delete_butt).display != "none") {
        delete_row(null, inputs[(i*5)])
      }      
    }
  }


}

async function get_sendable_request_data(request) {
  let result = {headers : {}}

  if (!request.method == 'GET') {
    add_content_type_header(request.body_mime_type)
  }

  for (let header of request.headers) {
    if (header.on && header.key !="" && header.value !="") {
      result.headers[header.key] = header.value || ""
    }
  }

  let query_params = []
  for (let param of request.query_params) {
    if (param.on && param.key !="") {
      if (param.value !="") {
        query_params.push([param.key, param.value].join("="))
      } else {
        query_params.push(param.key)
      }      
    }
  }

  // no query params, no "?" at the end
  if (query_params.length > 0) {
    result.url = [request.url, '?', query_params.join("&")].join("")
  } else {
    result.url = request.url
  }

  // and then I add "extra" fields based on the current state of the software
  app.useragent = app.useragent || await app.name + "/" + await  app.version + " (Tauri " + await app.tversion + ") " + app.platform + " (" +app.arch +")"
  result.headers["User-Agent"] = result.headers["User-Agent"] || app.useragent
  result.headers.Accept = result.headers.Accept || "*/*"
  result.headers["Accept-Encoding"] = result.headers["Accept-Encoding"] || "gzip, deflate, br"
  result.headers.Connection = result.headers.Connection || "keep-alive"
  //result.headers["Content-Type"] = request.body_mime_type

  result.method = request.method
  result.timeout = request.timeout

  switch(request.auth_type) {
    case "basic" :      
      result.headers.Authorization = 'Basic '+ btoa(request.auth.basic.username + ":" + request.auth.basic.password) 
    break
    case "bearer" :
      result.headers.Authorization = 'Bearer '+ request.auth.bearer.token
    break
    case "ntlm" :
      console.log("NTLM isn't not supprted yet")
    break
  }


  if (request.method != "GET") {
    switch(request.body_type) {
      case "form-data" :
        console.log("adding form-data body data")
        // this is not a result, this is only a JSON object with everything necessary in it
        //result.body = 
        let form_data_table_rows = request_table_to_json("form-data_table")
        let form_data_body = new FormData()
        for (let row of form_data_table_rows) {
          if (row.on && row.key != "" && row.value !="") {
            form_data_body.append(row.key, row.value)
          }
        }
        // for(let pair of form_data_body.entries()) {
        //   console.log("form data entries",pair[0]+', '+pair[1]);
        // }
        // replace content_type        
        //result.headers["Content-Type"] = 'multipart/form-data'
        // set body to newly generated data
        result.body = form_data_body
        console.log(form_data_table_rows, form_data_body)
      break

      case "x-www-form-urlencoded" :
        console.log("adding x-www-form-urlencoded body data")
        // this is not a result, this is only a JSON object with everything necessary in it
        //result.body = 
        let url_encoded_table_rows = request_table_to_json("x-www-form-urlencoded_table")
        let urlencoded_data_body = new URLSearchParams();      
        for (let row of url_encoded_table_rows) {
          if (row.on && row.key != "" && row.value !="") {
            urlencoded_data_body.append(row.key, row.value)
          }
        }
        result.headers["Content-Type"] = 'application/x-www-form-urlencoded'
        result.body = urlencoded_data_body.toString()
        console.log(url_encoded_table_rows, url_encoded_table_rows)
      break

      case "raw" :
        console.log("adding raw body data")
        result.body = request.body_data.raw
      break

      case "binary" :
        console.log("adding binary body data")
        result.body = request.body_data.data || await read_file_synchronyously(request.body_data.filename)
      break

      default:
      break
    }
  } else {
    console.log("GET requests can't have body. Stripping. (*Technically* they can, but FY)")
  }

  console.log("sendable request: ",JSON.stringify(result, null, 4))
  return result
}


// now I can call our Command!
// You will see "Welcome from Tauri" replaced
// by "Hello, World!"!
async function send_request() {

  


  // {
  //   method:method_name, 
  //   headers:{
  //     'Accept': '*'
  //   }, 
    
  //   }

  //document.getElementById('url_input').value = 'https://demo1-recorder-api.dev.ntrnx.com/api/recorder/settings/notifications?api-version=1.0'
  //fill_mock_data()

  // the request itself is built in here
  // fucking blobs made me do this asynchronously 
  let request = await build_request() // true means we'll drop some data
  console.log(request)
  
  app.current_request = JSON.parse(JSON.stringify(request))

 
  
  await write_request_file(app.current_tab)

  // oauth
  /*
var token_ // variable will store the token
var userName = "clientID"; // app clientID
var passWord = "secretKey"; // app clientSecret
var caspioTokenUrl = "https://xxx123.caspio.com/oauth/token"; // Your application token endpoint  
var request = new XMLHttpRequest(); 

function getToken(url, clientID, clientSecret) {
    var key;           
    request.open("POST", url, true); 
    request.setRequestHeader("Content-type", "application/json");
    request.send("grant_type=client_credentials&client_id="+clientID+"&"+"client_secret="+clientSecret); // specify the credentials to receive the token on request
    request.onreadystatechange = function () {
        if (request.readyState == request.DONE) {
            var response = request.responseText;
            var obj = JSON.parse(response); 
            key = obj.access_token; //store the value of the accesstoken
            token_ = key; // store token in your global variable "token_" or you could simply return the value of the access token from the function
        }
    }
}
// Get the token
getToken(caspioTokenUrl, userName, passWord);

function CallWebAPI() {
    var request_ = new XMLHttpRequest();        
    var encodedParams = encodeURIComponent(params);
    request_.open("GET", "https://xxx123.caspio.com/rest/v1/tables/", true);
    request_.setRequestHeader("Authorization", "Bearer "+ token_);
    request_.send();
    request_.onreadystatechange = function () {
        if (request_.readyState == 4 && request_.status == 200) {
            var response = request_.responseText;
            var obj = JSON.parse(response); 
            // handle data as needed... 

        }
    }
} 
  */
  let enable_proxy = document.getElementById("enable_proxy")?.checked
  if (enable_proxy) {
    console.log("proxy is on")
    request.proxy = { all: {url :"127.0.0.1:8080"}}
  }

  

  let result1
  let sendable_request = await get_sendable_request_data(request)    
  let start_time = new Date()
  // sending actuall request 
  try {
    console.log("rust fetch", sendable_request)    
    result1 = await app.fetch(sendable_request.url, sendable_request)
    console.log("result1", result1)
    
  } catch(err) {
    
    let network_info      = document.getElementById("network_info")
    let status_info       = document.getElementById("status_info")
    let timespan_info     = document.getElementById("timespan_info")
    let request_size_info = document.getElementById("request_size_info") 

    network_info.innerHTML      = ['❌'].join(" ")
    status_info.innerHTML       = ["Status:", "<span class='red'>-</span>"].join(" ")
    timespan_info.innerHTML     = ["Time:", "<span class='red'>-</span>"].join(" ")
    request_size_info.innerHTML = ["Size:", "<span class='red'>-</span>"].join(" ")

    let raw_response_editor = document.getElementById("raw_response_body_data")
    let pre_response_editor = document.getElementById("raw_response_body_data")
    console.log(err)
    // settings output views:
    /* pretty  */ response_editor.setValue(err.message || err)
    /* raw     */ raw_response_editor.textContent = err.message || err
    /* preview */ pre_response_editor.innerHTML = err.message || err
    document.getElementById('preview_response_body_data').src = "data:text/html;charset=utf-8," + encodeURIComponent(scrollbar_fix + (err.message || err));
    
    return
  }

  let end_time = new Date()
  let date_time = new Date()
  
  let response_table = document.getElementById("response_headers_table")
  response_table.innerHTML = "<tr><th>Key</th><th>Value</th></tr>"
  
  for (let i in window.sessionStorage) {
    let item = window.sessionStorage[i]
    //console.log(item)
  }
  //console.log(window.sessionStorage.length)

  if (result1) {



    let response_headers = {}
    for (let pair of result1.headers.entries()) {
      if (pair[0] != "set-cookie") {
        let tr = document.createElement('tr')
        let td1 = document.createElement('td')
        let td2 = document.createElement('td')
        td1.textContent = pair[0]
        td2.textContent = pair[1]
        response_headers[pair[0]] = pair[1]
        tr.appendChild(td1)
        tr.appendChild(td2)
        response_table.appendChild(tr)
        //console.log(pair)
      } else {
        console.log(pair)
      }
  }
  
  
  let cookies = await result1.headers.getSetCookie()
  let known_cookie_fields = ['domain', 'path', 'expires', 'httponly', 'secure', 'samesite', 'max-age']
  let parsed_cookies = []
  for (let cookie of cookies) {
    let fields = cookie.split(";")    
    let parsed_cookie = {      
      domain : (new URL(sendable_request.url)).hostname,
      httponly : "no",
      secure : "no",
      samesite : "no",
      path : "/"
    }
    for (let field of fields) {
      let [key, value] = field.split("=")
      let tkey = key.trim().toLowerCase()
      if (known_cookie_fields.includes(tkey)) {
        parsed_cookie[tkey] = (value || "yes").trim()
      } else {
        parsed_cookie[key.trim()] = (value || "yes").trim()
      }
    }
    parsed_cookie.expires = parsed_cookie["max-age"] || parsed_cookie.expires || "Session"
    let maxage = Number(parsed_cookie.expires)
    if (!isNaN(maxage)) {
      // if Expires can be converted to a number then calculate the expiration date
      parsed_cookie.expires = (new Date(start_time.getTime() + maxage)).toUTCString()
    }    
    parsed_cookies.push(parsed_cookie)
  }

  //console.log("cookies", cookies)
  console.log("parsed_cookies", parsed_cookies)

  let response_cookies_table = document.getElementById("response_cookies_table")
  response_cookies_table.innerHTML = '<tr><th>Name</th><th>Value</th><th>Domain</th><th>Path</th><th>Expires</th><th>HttpOnly</th><th>Secure</th><th>SameSite</th></tr>'
  for (let cookie of parsed_cookies) {
    let cookie_name
    let cookie_value
    for (let key in cookie) {
      if (!known_cookie_fields.includes(key.toLowerCase())) {
        cookie_name = key
        cookie_value = cookie[key]
      }       
    }
    
    let tr = document.createElement('tr')
    let td1 = document.createElement('td')
    let td2 = document.createElement('td')
    let td3 = document.createElement('td')
    let td4 = document.createElement('td')
    let td5 = document.createElement('td')
    let td6 = document.createElement('td')
    let td7 = document.createElement('td')
    let td8 = document.createElement('td')
    td1.textContent = cookie_name
    td2.textContent = cookie_value
    td3.textContent = cookie.domain   || cookie.Domain
    td4.textContent = cookie.path     || cookie.Path
    td5.textContent = cookie.expires  || cookie.Expires
    td6.textContent = cookie.httponly || cookie.HttpOnly
    td7.textContent = cookie.secure   || cookie.Secure
    td8.textContent = cookie.samesite || cookie.SameSite
    tr.appendChild(td1)
    tr.appendChild(td2)
    tr.appendChild(td3)
    tr.appendChild(td4)
    tr.appendChild(td5)
    tr.appendChild(td6)
    tr.appendChild(td7)
    tr.appendChild(td8)
    response_cookies_table.appendChild(tr)
  
  }


    let result2
    let code = ""
    let mode = "text"
    if (~response_headers['content-type']?.indexOf("json")) {
      mode = "json"
    }

    if (~response_headers['content-type']?.indexOf("xml")) {
      mode = "xml"
    }

    if (~response_headers['content-type']?.indexOf("html")) {
      mode = "html"
    }

    if (~response_headers['content-type']?.indexOf("css")) {
      mode = "css"
    }


    try {    
      result2 = ""
      switch(mode) {
        case "json":
          result2 = JSON.stringify(await (result1).json())
        break;
        default:
          result2 = await (result1).text()//
        break;
      }
      code = result2
    } catch(err) {
      console.log(err,result1)    
    }


    
    let network_info      = document.getElementById("network_info")
    let status_info       = document.getElementById("status_info")
    let timespan_info     = document.getElementById("timespan_info")
    let request_size_info = document.getElementById("request_size_info") 

    let elapsed = 2*end_time.getTime() - start_time.getTime() - date_time.getTime()

    let body_length = code.length
    let headers_length = JSON.stringify(response_headers).length
    //console.log("body_length", body_length, "headers_length", headers_length)

    network_info.innerHTML      = ['🌍'].join(" ")
    status_info.innerHTML       = ["Status:", "<span class='green'>", result1.status, result1.statusText,'</span>'].join(" ")
    timespan_info.innerHTML     = ["Time:", "<span class='green'>", elapsed, 'ms','</span>'].join(" ")
    request_size_info.innerHTML = ["Size:", "<span class='green'>", Math.ceil((body_length + headers_length)/10)/100, 'KB','</span>'].join(" ")
    
    let raw_response_editor = document.getElementById("raw_response_body_data")
    let pre_response_editor = document.getElementById('preview_response_body_data')
    

    // beautify response ============
    let response_body_type_select = document.getElementById('response_body_type_select')
    //response_body_type_select.value = mode
    //response_body_type_select.click()
    let combobox = response_body_type_select
    while (!(combobox.classList?.contains('dropdown'))) {
      combobox = combobox.parentElement
    }  

    

    let items = combobox.getElementsByClassName("dropdown-item")
    for (let item of items) {
      if (~item.getAttribute("value").indexOf(mode)) {
        item.click()
        console.log("clicked", item, mode)
        break
      }
    }
    // ====================



    // settings output views:
    /* pretty  */ await response_editor.setValue(code || "")
                  let beautify_raw_data_response = document.getElementById("beautify_raw_data_response")
                   beautify_raw_data_response.click()    
                  //response_editor.setOption("mode", mode) 
                  // ^ this is not needed, 
                  // as "mode" is set inside the dropdown click routine
                  // plus, "mode" here is wrong anyway: "json" instead of "application/ld+json" etc  
    /* raw     */ raw_response_editor.textContent = code
    /* preview */ pre_response_editor.src = "data:text/html;charset=utf-8," + encodeURIComponent(scrollbar_fix + code);
      


    // 
    
  
  }
}

// ====================================================
function code_beautify(source, mode) {
  console.log('code_beautify', source, mode)
  let result = source
  let options = { 
    "indent_size": "2",
    "indent_char": " ",
    "max_preserve_newlines": "0",
    "preserve_newlines": true,
    "keep_array_indentation": true,
    "break_chained_methods": false,
    "indent_scripts": "normal",
    "brace_style": "expand",
    "space_before_conditional": false,
    "unescape_strings": false,
    "jslint_happy": false,
    "end_with_newline": true,
    "wrap_line_length": "0",
    "indent_inner_html": true,
    "e4x": true,
    "indent_empty_lines": false
  }
  switch (mode) {
    case "xml":
      //console.log('sorting as XML')
      
      let xml = new DOMParser().parseFromString(source, 'application/xml');
      var sorting_params = new DOMParser().parseFromString([
        // describes how I want to modify the XML - indent everything
        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:strip-space elements="*"/>',
        '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
        '    <xsl:value-of select="normalize-space(.)"/>',
        '  </xsl:template>',
        '  <xsl:template match="node()|@*">',
        '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
        '  </xsl:template>',
        '  <xsl:output indent="yes"/>',
        '</xsl:stylesheet>',
      ].join('\n'), 'application/xml');

      let processor = new XSLTProcessor();    
      processor.importStylesheet(sorting_params);
      let xml_doc = processor.transformToDocument(xml)            
      let sub_result = new XMLSerializer().serializeToString(xml_doc);
      if (!~sub_result.indexOf('parsererror')) {
        result=sub_result
      } else {
        result = html_beautify(source, options)
      }      
    break
    
    case 'html':
      result = html_beautify(source, options)
    break

    case 'css':
      result = css_beautify(source, options)
    break

    case 'application/ld+json':
      result = js_beautify(source, options)
    break

    case 'javascript':
      result = js_beautify(source, options)
    break
    
  }
  return result
};

function beautify_button_click(event) {  
  let mode = document.getElementById(this.getAttribute('syntax_type_selector')).value
  let editor_name = this.getAttribute('editor')
  //console.log('beautify click', event, editor_name, mode )  
  let editor = window.exports[editor_name]  
  let new_code = code_beautify(editor.getValue(), mode)
  //console.log(new_code)
  editor.setValue(new_code)
}



function open_tab(event, element){
  

  let tabview = element || this  
  while (!tabview.classList.contains("tabview")) {    
    tabview = tabview.parentElement    
  }
  
  let panes = tabview.getElementsByClassName("tabpanel")  
  
  // only immediate children (depth==1) should be affected by show/hide
  for (let pane of panes) {    
    // console.log("========= this",this)
    // console.log("========= elem",element)
    // console.log("========= jeq?",tabview == pane.parentElement)
    // console.log("========= tabv",tabview)
    // console.log("========= pane",pane.parentElement)
  
    if (~pane.id.indexOf(this.value) && tabview == pane.parentElement) {
      pane.style.display = "block";
      // console.log(pane.id, 'block')
    } else if(tabview == pane.parentElement) {
      pane.style.display = "none";
      // console.log(pane.id, 'none')
    } else {
      // console.log(pane.id, 'else')
    }

    if (this.value == "authorization") {
      let auth_type_select = document.getElementById("auth_type_select")
      show_auth_tab(auth_type_select.value)
    }

    if (this.value == "raw") {
      let body_mime_type_select = document.getElementById("body_mime_type_select")
      body_mime_type_select.style.display = "inline"
    } else {
      let body_mime_type_select = document.getElementById("body_mime_type_select")
      body_mime_type_select.style.display = "none"
    }
   }
}

function enable_row() {  
  let row = this  
  while (!(row.tagName.toLowerCase() == "tr")) {    
    row = row.parentElement
  }
  
  let inputs = row.getElementsByTagName('input')
  let key_found
  for (let input of inputs) {
    if (input.classList.contains('key') && input.value.trim() != '') {
      key_found = true
    }
  }
  if (key_found) {
    let checkbox = row.getElementsByClassName('enable_row')[0]
    checkbox.checked = true
  }

}

function delete_row(event, element) {    
  //console.log("removing row", this, element)
  // find a row *this* button is from
  let row = element || this
  while (!(row?.tagName?.toLowerCase() == "tr")) {    
    //console.log("row",row, row?.tagName)
    row = row.parentElement
  }

  // the last row's button is always hidden, so there's no way to delete it
  row.remove()
  // tus, all of this is not needed:
  // // find the table *this* button's row is from
  // let table = row
  // while (!(table.tagName.toLowerCase() =="table")) {
  //   table = table.parentElement
  // }

  // // get row length of the table
  // let rows = table.getElementsByTagName("tr")
  // // get last row
  // let last_row = rows[rows.length-1]
  // // if this isn't the last row then delete (the last row is always empty and its addition is automatized)
  // if (row != last_row) {
  //   row.remove()
  // } else {
  //   console.log("don't delete, this is the last row")
  // }

}

function select_all(event) {
  if (event.code == 'KeyA' && event.ctrlKey) {
    let range = document.createRange();
    let element = this
    range.selectNodeContents(element)
    let selection=window.getSelection(); 
    selection.removeAllRanges(); 
    selection.addRange(range); 
  }
}

// remove ctrl+a across the app, allowing to select only what is fine to be selected
document.onkeydown=function(event)
{ 
  
  if ((event.target.tagName.toLowerCase() != 'input') && (event.target.tagName.toLowerCase() != 'textarea')) {
    if(event.code == 'KeyA' && event.ctrlKey == true) {
      return false;
    }
  }
}

function add_row2(event, element) {  
  //document.getElementById("url_input").value = stringify_request_query_params()
  
  let row = element || this  
  while (!(row.tagName.toLowerCase() == "tr")) {
    row = row.parentElement
  }
  let inputs = row.getElementsByTagName('input')
  let key_found
  let value_found
  for (let input of inputs) {
    if (input.classList.contains('key') && input.value.trim() != '') {
      key_found = true
    }
    if (input.classList.contains('value') && input.value.trim() != '') {
      value_found = true
    }
  }

  if (key_found && value_found) {
    add_row(event, row)
  }
}

function add_row(event, element, data) {
  console.log("adding row", data)
  let table = element || this

  while (!table.classList.contains("request_params_table")) {
    //console.log(table.parentElement)
    table = table.parentElement
  }

  let rows = table.getElementsByTagName('tr')
  if (rows.length > 1) {  // changed this to 1 to avoid spawning extra rows
    let last_row = rows[rows.length-1]
    let tds = last_row.getElementsByTagName("input")
    
    let tabpanel = table
    while (!(tabpanel.classList?.contains('tabpanel'))) {
      tabpanel = tabpanel.parentElement
    }
  
    if (event && event.code == 'ArrowDown') {
      tabpanel.scrollTo(0, tabpanel.scrollHeight);
      tds[1].focus()
    }

    // inputs: checkbox, 3*text, button (not an input)
    if (tds[1].value != "" && tds[2].value != "") {
    } else {
      // prevents addition of new empty rows upon key press
      if (!data) {
        console.log("here?")
        return
      }
    }
  } else {
    
  }

  let tr = document.createElement('tr')
  let td1 = document.createElement('td')
  let td2 = document.createElement('td')
  let td3 = document.createElement('td')
  let td4 = document.createElement('td')
  let td5 = document.createElement('td')
  let lb =  document.createElement('label')  
  let cb =  document.createElement('input')  
  let db =  document.createElement('input')
  let ed1 = document.createElement('input')
  let ed2 = document.createElement('input')
  let ed3 = document.createElement('input')
  
  ed1.type = 'text'
  ed1.classList.add('key')
  ed2.type = 'text'
  ed2.classList.add('value')
  ed3.type = 'text'
  cb.type = 'checkbox'
  cb.classList.add('enable_row')
  db.type = 'button'
  db.value = '🗑️'

  db.addEventListener("click", delete_row);  
  ed1.addEventListener("blur", enable_row);
  ed1.addEventListener("keyup", add_row2);
  ed2.addEventListener("keyup", add_row2);
  ed3.addEventListener("keyup", add_row2);

  lb.appendChild(cb)
  td1.appendChild(lb)
  td2.appendChild(ed1)
  td3.appendChild(ed2)
  td4.appendChild(ed3)
  td5.appendChild(db)
  tr.appendChild(td1)
  tr.appendChild(td2)
  tr.appendChild(td3)
  tr.appendChild(td4)
  tr.appendChild(td5)
  table.appendChild(tr)
  
  if (data) {
    console.log("data", data)
    ed1.value  = data.key || ""
    ed2.value  = data.value || ""
    ed3.value  = data.description || ""  
    cb.checked = data.on || false
    // this is needed because when I manually enter stuff, it add a new row below the current one
    // but when I call this from the code, it inserts empty rows after each `data`
    if (!data.prevent_addition_of_a_new_row && data.enabled) {
      console.log("THIS IS WHERE IT ADDS ONE MORE ROW")
      let event  = new Event('keyup')
      ed1.dispatchEvent(event);
    }
  }

}

function option_selected(event, element) {
  let combobox = element || this  
  while (!(combobox.classList?.contains('dropdown'))) {
    combobox = combobox.parentElement
  }  
  let button = combobox.getElementsByClassName('dropbtn')[0]
  let menu = combobox.getElementsByClassName('dropdown-content')[0] || combobox.getElementsByClassName('dropdown-content-replace')[0]
  let style = window.getComputedStyle(element || this)
  let color = style.getPropertyValue('color')
  button.value = (element || this).getAttribute('value')
  if (button.id == "body_mime_type_select" ) {
    let editor = window.exports[button.getAttribute('editor')]
    console.log('settings mode', button.value)
    if (button.value == 'html') {
      editor.setOption("mode", {
        name: "htmlmixed",
        tags: {
          style: [["type", /^text\/(x-)?scss$/, "text/x-scss"],
                  [null, null, "css"]],
          custom: [[null, null, "customMode"]]
        }
      });
    } else {
      editor.setOption("mode", button.value);
    }
    
    if (button.value == 'javascript') {
      editor.setOption("lint", true)
    } else {
      editor.setOption("lint", false)
    }

    let method = document.getElementById('metod_select').value
    if (!(method == 'GET')) {
      add_content_type_header(button.value)
    }
  } 
  
  if (button.id == "metod_select") {
    button.style.color = color    
  } 

  if (button.id == "auth_type_select") {
    show_auth_tab(button.value)
  } 

  button.textContent = (element || this).textContent
  menu.style.display = 'none'
}

function open_combobox(event) {
  let combobox = this  
  while (!(combobox.classList?.contains('dropdown'))) {
    combobox = combobox.parentElement
  }  

  let opened = (JSON.parse(combobox.getAttribute('opened')))
  //console.log(opened)
  if (opened) {
    let menu = combobox.getElementsByClassName('dropdown-content')[0] || combobox.getElementsByClassName('dropdown-content-replace')[0]
    // menu_items might not be there if there's no submenu
    if (menu) {
      menu.style.display = 'none'
    }
  } else {

    let menu = combobox.getElementsByClassName('dropdown-content')[0] || combobox.getElementsByClassName('dropdown-content-replace')[0]
    let button = combobox.getElementsByClassName('dropbtn')[0]
    let items = menu.getElementsByClassName('dropdown-item')
    for (let item of items) {    
      if (item.getAttribute('value') == button.value) {
          item.setAttribute('selected', true)
      } else {
        item.setAttribute('selected', false)
      }
    }
    // this changes value of the combobox to its *text* value (i.e. the visible one) and botches all the comboboxes logic
    //button.value = this.textContent
    menu.style.display = 'block'
  }
  combobox.setAttribute('opened', !opened)
  event.stopPropagation()
}

function init_comboboxes() {
  let comboboxes_names =["metod_select", "body_mime_type_select", "response_body_type_select", "auth_type_select"]
  for (let combobox_name of comboboxes_names) {
    let combobox = document.getElementById(combobox_name)    
    let select = combobox.parentElement
    let button = select.getElementsByClassName('dropbtn')[0]
    let options = select.getElementsByClassName('dropdown-item')
    for (let option of options) {
      option.addEventListener('click', option_selected)
    }
    button.addEventListener('click', open_combobox)
  }
}


function open_menu(event) {  
  close_all_menus(event)
  let menu = this  
  while (!(menu.classList?.contains('dropdown'))) {
    menu = menu.parentElement
  }  

  let navbar = menu
  while (!(navbar.classList?.contains('navbar'))) {
    navbar = navbar.parentElement
  }  

  let opened = !(JSON.parse(navbar.getAttribute('opened')))
  navbar.setAttribute('opened', opened)
  
  let menu_items = menu.getElementsByClassName('dropdown-content')[0] || menu.getElementsByClassName('dropdown-content-replace')[0]
  if (opened) {
    menu_items.style.display = 'block'
  } else {
    menu_items.style.display = 'none'
  }
}

function menu_item_clicked() {
  let menu = this  

  // process the click --------
    
    switch(this.id) {
      // file
      case "app_exit_menu_item":        
        app.process.exit(0);
      break;
      case "password_generator_menu_item":
        let pass = btoa(String.fromCharCode.apply(null, crypto.getRandomValues(new Uint8Array(18))))
        app.clipboard.writeText(pass)
      break;
      default:
        let popup_id = this.id.replace("_menu_item", "")
        let popup = document.getElementById(popup_id)
        popup.style.display = 'flex'
      break;
    }
  // --------------------------

  while (!(menu.classList?.contains('dropdown'))) {
    menu = menu.parentElement
  }  

  let navbar = menu
  while (!(navbar.classList?.contains('navbar'))) {
    navbar = navbar.parentElement
  }  

  navbar.setAttribute('opened', false)
  
  let menu_items = menu.getElementsByClassName('dropdown-content')[0] || menu.getElementsByClassName('dropdown-content-replace')[0]
  menu_items.style.display = 'none'
  
}

function enter_menu(){
  let menu = this  
  while (!(menu.classList?.contains('dropdown'))) {
    menu = menu.parentElement
  }  

  let navbar = menu
  while (!(navbar.classList?.contains('navbar'))) {
    navbar = navbar.parentElement
  }   

  let opened = (JSON.parse(navbar.getAttribute('opened')))
  if (opened) {
    let menus = navbar.getElementsByClassName('dropdown')    
    for (let me of menus) {      
      let menu_items = me.getElementsByClassName('dropdown-content')[0] || me.getElementsByClassName('dropdown-content-replace')[0]
      // menu_items might not be there if there's no submenu
      if (menu_items) {        
        if (me != menu) {          
          menu_items.style.display = 'none'
        } else {
          menu_items.style.display = 'block'
        }
      }
    }
  }
}

function close_all_menus(event) {
  if (event?.srcElement != this && (event?.srcElement?.classList?.contains('dropdown') || event?.srcElement?.classList?.contains('dropbtn'))) {
    return
  }

  let menus = this.getElementsByClassName('dropdown')
  for (let me of menus) {
    let menu_items = me.getElementsByClassName('dropdown-content')[0] || me.getElementsByClassName('dropdown-content-replace')[0]
    // menu_items might not be there if there's no submenu
    if (menu_items) {
      menu_items.style.display = 'none'
    }
    let opened = (JSON.parse(me.getAttribute('opened')))
    //me.setAttribute('opened', !opened) // this fixes menus opening on 2nd click after select+ 2/more clicks anywhere else
    me.setAttribute('opened', false)
  }

  let navbars = this.getElementsByClassName('navbar')
  for (let navbar of navbars) {
    navbar.setAttribute('opened', false)
  }

}

function init_menus() {
  // firstly, add global closing menu callback
  document.getElementsByTagName("body")[0].addEventListener("click", close_all_menus);

  // secondly, make all menus work 
  let menus = document.getElementsByClassName("navbar")  
  for (let menu of menus) {
    let buttons = menu.getElementsByClassName('dropbtn')
    for (let button of buttons) {
      let items = menu.getElementsByClassName('dropdown-item')
      for (let item of items) {
        item.addEventListener('click', menu_item_clicked)
      }
      button.addEventListener('click', open_menu)
      button.addEventListener('mouseenter', enter_menu)
    }
  }
}


function hide_element(event) {
  if (event.target == this) {
    this.style.display = 'none'
  }
}

function init_popups() {
  let popups = document.getElementsByClassName("popup_wrapper")  
  for (let popup of popups) {
    popup.addEventListener('click', hide_element)
  }
}


function input_box(options) {
  let output
  let box       = document.getElementById('app_input_box')
  let yes       = document.getElementById('yes')
  let no        = document.getElementById('no')
  let title     = document.getElementById('input_box_title')
  let message   = document.getElementById('input_box_message')
  let input     = document.getElementById('input_box_input')
  
  if (options.buttons.includes('yes')) {
    yes.style.display = 'inline-block'
    yes.value = 'yes'
  } else {
    yes.style.display = 'none'
  }

  if (options.buttons.includes('yes')) {
    no.style.display = 'inline-block'
    no.value = 'yes'
  } else {
    no.style.display = 'none'
  }
  
 
  if (options.buttons.includes('confirm')) {
    yes.style.display = 'inline-block'
    yes.value = 'confirm'
  } else {
    yes.style.display = 'none'
  }

  if (options.buttons.includes('cancel')) {
    no.style.display = 'inline-block'
    no.value = 'cancel'
  } else {
    no.style.display = 'none'
  }
  

  if (options.type == 'input') {
    no.style.display = 'inline-block'
  } else {
    no.style.display = 'none'
  }

  if (options.title) {
    title.display = 'block'
    title.textContent = options.title
  } else {
    title.display = 'none'
  } 

  if (options.title) {
    message.display = 'block'
    message.textContent = options.message
  } else {
    message.display = 'none'
  } 
  

  box.style.display = 'flex'
  return output
}

async function keyboard_shortcuts_handler(event) {
  //console.log(event)  
  if (event.ctrlKey) {
    //save
    if (event.code === 'KeyS') {
     // save current request
     let request = await build_request()
     app.current_request = JSON.parse(JSON.stringify(request))
     await write_request_file(app.current_tab)
     return 
   } 
   
   // send
   if (event.code === "Enter") {
     // run qurent request
     await send_request()
     return
   }

 }

   // renaming
   if (event.code === "F2") {
    // run qurent request
    let new_name = await input_box({type:'input', buttons: ['confirm', 'cancel'], title: 'Type a new name for selected item'})
    return
  }

}


function handle_buttons(self) {
  //console.log(self.id)
}

function set_modified(id, yes) {
  let button = document.getElementById(id)
  //console.log(button)
  if (yes) {
    // make tab appear modified    
    button.setAttribute("modified", true)  
  } else {
    // make tab appear unmodified
    button.setAttribute("modified", false)
  }
}

async function write_request_file(request_id, is_modified) {
  if (request_id) {    
    try {
      // I have 2 files: tmp_ and the regular one
      let filename = request_id + '.json'      
      if (is_modified) {
        // if modified, then write only to the _tmp one
        filename = "tmp_" + filename
        console.log("writing " + filename)
        await app.writeTextFile(filename, JSON.stringify(app.current_request, null, 2), { baseDir: 15 }) // localappdata
      } else {
        // if NOT modified (i.e. saved), saving goes to BOTH files (since we first read the tmp file)
        console.log("writing " + filename)
        await app.writeTextFile(filename, JSON.stringify(app.current_request, null, 2), { baseDir: 15 }) // localappdata
        filename = "tmp_" + filename
        console.log("writing " + filename)
        await app.writeTextFile(filename, JSON.stringify(app.current_request, null, 2), { baseDir: 15 }) // localappdata
      }
      // RESULT: the _tmp file is always saved and loaded first
      //         permanent changes go to the ergular file (the one eventually shared across dvices)
      set_modified(request_id, is_modified)
    } catch(err) {
      console.log('can\'t write file', err)
    }
    // this ^ never returns anything
  } else {
    console.log("Can't write the file, as request_id is undefined")
  }
}

async function read_request_file(request_id) {
  console.log("reading " + request_id + '.json')
  try {
    let filename = request_id + '.json'
    let data
    try {
       data = await app.readTextFile("tmp_"+filename, { baseDir: 15 })
    } catch(err) {
      try {
        data = await app.readTextFile(filename, { baseDir: 15 })
      } catch(err) {        
      }
    }
    console.log("read file contents:" + data)
    let result = JSON.parse(data) // if data is null, this will fail and catch() will fire
    return  result
  } catch(err) {
    console.log( err)
  }
}

let scrolling_tab_bar_enabled

function main_scroll_tabbar_start() {
  clearInterval(scrolling_tab_bar_enabled)
  let scrollable = document.getElementById('request_bar_scroll_area')
  if (this.id == 'request_row_right_button') {
    scrolling_tab_bar_enabled = setInterval(
      function() {
        scrollable.scrollLeft = scrollable.scrollLeft + 10
      }
    )

  } else {
    scrolling_tab_bar_enabled = setInterval(
      function() {
        scrollable.scrollLeft = scrollable.scrollLeft - 10
      }
    )
  }
}

function main_scroll_tabbar_end() {
  clearInterval(scrolling_tab_bar_enabled)
}

function main_scroll_tabbar_wheel(event) {
  let delta = event.deltaY
  this.scrollLeft = this.scrollLeft + delta
}



async function request_tab_click(event) {
  console.log("CLICKED!!!!!!!!!!") 
  let request = await build_request()
  app.current_request = JSON.parse(JSON.stringify(request))

  let current_tab = document.getElementById(app.current_tab)
  let is_modified = JSON.parse(current_tab.getAttribute("modified"))
  //console.log("setting modified inside tab_click", is_modified) 
  if (is_modified) { // true/false shenanigans
    await write_request_file(app.current_tab, true)
  } else {
    await write_request_file(app.current_tab)
  }
  


  if ((this.scrollWidth - event.offsetX < 25*1.34) || event.target.classList.contains('close_button')) {    
    let opened_tabs = []
    for (let tid of app.opened_tabs) {      
      if (this.id != tid) {
        opened_tabs.push(tid)        
      }
    }
    app.opened_tabs = opened_tabs
    this.remove()
  } else {
    let tab_id = this.id
    //console.log("^^^^^^^^^^^^^^^^^^^^^^")
    //console.log("tab_id", tab_id)
    //console.log("app.opened_tabs", app.opened_tabs)
   
    for (let tid of app.opened_tabs) {
      //console.log("tid", tid)
      if (tab_id == tid) {
        app.current_tab = tid
        break 
      }
    }
    //console.log("vvvvvvvvvvvvvvvvvvvvvv")
  }
  
  await manage_tab_history() // this also manages file reading/writing

  adjust_main_tabbar_buttons()

}

async function manage_tab_history(new_tab) {
  // unconditionally add current tab to the history  

  app.tab_history.push(app.current_tab)
  console.log("adding " + app.current_tab + ' to the history')
  

  console.log("app.tab_history", app.tab_history)
  console.log("app.opened_tabs", app.opened_tabs)

  // then get all the currently opened tabs and delete closed ones from the history
  let tabs = app.opened_tabs
  let tmp_history = []
  let last_added
  for (let hid of app.tab_history) {
    //console.log("hid", hid)
    for (let tid of tabs) {
      //console.log("tid", tid, tid == hid)
      if (tid == hid) {
        if (last_added != hid) {
          tmp_history.push(hid)
          last_added = hid
        } else {
          //console.log("removed duplicate item", hid)  
        }
        //console.log("break")
        break
      } 
    }
  }
  //console.log("tmp_history", tmp_history)
  app.tab_history = tmp_history
  let tab_id = tmp_history[tmp_history.length - 1]
  
  for (let tid of app.opened_tabs) {
    //console.log(tab_id, tid)
    if (tid == tab_id) {
      app.current_tab = tid
      break 
    }
  }

  // whatever in that file gets into current request data structure (and I can expect this to alvays be there)
  if (!new_tab) {
    try {
      app.current_request = await read_request_file(app.current_tab)
      console.log("app.current_request", app.current_request)
    } catch(err) {
      // this is fine if there's no file to read (i.e. it's a new tab)
      console.log(err)
    }
  } else {
    app.current_request = build_empty_request()
  }  
  // fills UI with data from the file
  fill_in_forms()

  // save opened tabs
  await save_opened_tabs()
}

function build_empty_request() {
  let result = {
    method : "GET",
    url : "",
    base_url : "",
    query_params : [],
    headers : [],
    auth_type : "none",
    body_type : "none",
    scripts : {
      pre : "",
      post : ","
    },
    body_data : {
      raw : "",
      "form-data" : [],
      "x-www-form-urlencoded" : [],
      binary : {
        filename: "", 
        data: null
      }
    },
    body_mime_type : "text/plain"
  }
  return result
}

function fill_in_forms() {  
  if (app.current_request) {//
    console.log('filling forms with',app.current_request)


    let container = document.getElementById("request_body_wrapper")
    let tables = container.getElementsByClassName("request_params_table")
  
    for (let table of tables) {
      table.innerHTML = "<tr><th>✅</th><th>Key</th><th>Value</th><th>Description</th><th>🗑️</th></tr>" 
      let param_count = 0
      for (let pid in app.current_request?.query_params) {
        param_count = param_count + 1
      }
    }
    
    // fill in headers
    let headers_table = document.getElementById("headers_table")
    for (let hid in app.current_request.headers) {
      let data = app.current_request.headers[hid]
      add_row(null, headers_table, {key: data.key, value: data.value, enabled: data.enabled, on:data.on, description:data.description, prevent_addition_of_a_new_row : true}) 
    }

    // fill in query params
    let query_params_table = document.getElementById("query_params_table")
    for (let qpid in app.current_request.query_params) {
      let data = app.current_request.query_params[qpid]
      add_row(null, query_params_table, {key: data.key, value: data.value, enabled: data.enabled, on:data.on, description:data.description, prevent_addition_of_a_new_row : true}) 
    }


    let metod_select = document.getElementById("metod_select")
    //metod_select.value = app.current_request.method || ""//
    let combobox = metod_select
    while (!(combobox.classList?.contains('dropdown'))) {
      combobox = combobox.parentElement
    }  
    let meitems = combobox.getElementsByClassName("dropdown-item")
    for (let item of meitems) {
      if (~item.getAttribute("value").indexOf(app.current_request.method)) {
        item.click()
        console.log("clicked", item, app.current_request.method)
        break
      }
    }


    let url_input = document.getElementById("url_input")
    url_input.value = app.current_request.base_url || ""

    let auth_type_select = document.getElementById("auth_type_select")
    let items = auth_type_select.parentElement.getElementsByClassName("dropdown-item")
    //console.log("items",items)
    for (let item of items) {      
      if (item.getAttribute("value") == app.current_request.auth_type) {
        //console.log("clicking",item)
        option_selected(null, item)
        break
      }
    }
    auth_type_select.value = app.current_request.auth_type


    ///===============================================================================
    let auth_panel =  document.getElementById('auth_right_side')
    let auth_inputs = auth_panel.getElementsByClassName("auth_input")

    
    for (let input of auth_inputs) {
      if (input.classList.contains("username_input")) {
        input.value = app.current_request.user || ""
        //console.log("setting username",input.id)
      }
      if (input.classList.contains("password_input")) {
        input.value = app.current_request.password || ""
        //console.log("setting password",input.id)
      }
      if (input.classList.contains("token_input")) {
        input.value = app.current_request.token || ""
        //console.log("setting token",input.id)
      }
      if (input.classList.contains("domain_input")) {
        input.value = app.current_request.domain || ""
        //console.log("setting domain",input.id)
      }
      if (input.classList.contains("workstation_input")) {
        input.value = app.current_request.workstation || ""
        //console.log("setting workstation",input.id)
      }
    }

    // process body  ==================

    //result.body_type
    let request_body_tabbar = document.getElementById('request_body_tabbar')
    let radios = request_body_tabbar.getElementsByClassName('tab_header_button')
    for (let radio of radios) {
      if (radio.value == app.current_request.body_type) {
        radio.click()
      }
    }

    // fill in form-data
    console.log("fill in form-data")
    let form_data_table = document.getElementById("form-data_table")
    for (let fdid in app.current_request.body_data["form-data"]) {
      let data = app.current_request.body_data["form-data"][fdid]
      add_row(null, form_data_table, {key: data.key, value: data.value, enabled: data.enabled, on: data.on, description:data.description, prevent_addition_of_a_new_row : true}) 
    }

    // fill in x-www-form-urlencoded_table
    console.log("fill in x-www-form-urlencoded_table")
    let x_www_form_urlencoded_table = document.getElementById("x-www-form-urlencoded_table")
    for (let xfid in app.current_request.body_data["x-www-form-urlencoded"]) {
      let data = app.current_request.body_data["x-www-form-urlencoded"][xfid]
      add_row(null, x_www_form_urlencoded_table, {key: data.key, value: data.value, enabled: data.enabled, on: data.on, description:data.description, prevent_addition_of_a_new_row : true}) 
    }

    // raw body data
    body_editor.setValue(app.current_request.body_data.raw || "")

    // binary body data
    let body_binary_file_input = document.getElementById("body_binary_file_input")
    body_binary_file_input.value = app.current_request.body_data.binary.filename || "Browse..."

    // body mime type
    let body_mime_type_select = document.getElementById("body_mime_type_select")
    let mitems = body_mime_type_select.parentElement.getElementsByClassName("dropdown-item")
    //console.log("items",items)
    for (let item of mitems) {      
      if (item.getAttribute("value") == app.current_request.body_mime_type) {
        //console.log("clicking",item)
        option_selected(null, item)
        break
      }
    }
    body_mime_type_select.value = app.current_request.body_mime_type


    //result.body_mime_type


    for (let table of tables) {
        add_row(null, table)
    }
  
    ///===============================================================================
    // process response
    

  } else {
    console.log('can\'t fill anything as app.current_request is empty')
  }
}


function adjust_main_tabbar_buttons() {
  let request_bar_scroll_area = document.getElementById('request_bar_scroll_area')
  let enable_scroll_buttons = request_bar_scroll_area.scrollWidth > (document.getElementById('request_area').clientWidth - 150)

  //console.log(enable_scroll_buttons)

  let request_row_right_button = document.getElementById('request_row_right_button')
  let request_row_left_button  = document.getElementById('request_row_left_button')
  let buttons = request_bar_scroll_area.getElementsByClassName("request_tabbutton")

  for (let button of buttons) {
    if (enable_scroll_buttons) {
      request_row_right_button.style.display = "initial"
      request_row_left_button.style.display = "initial"      
      button.classList.remove("request_tabbutton_few")
    } else {
      button.classList.add("request_tabbutton_few")
      request_row_right_button.style.display = "none"
      request_row_left_button.style.display = "none"
    }
    if (button.id == app.current_tab) {
      button.style.backgroundColor = "#444"
    } else {
      button.style.backgroundColor = "#222"
    }
  }

  let sendbar               = document.getElementById("sendbar")
  let current_request_path  = document.getElementById("current_request_path")
  let request_data_wrapper  = document.getElementById("request_data_wrapper")
  let starting_message      = document.getElementById("starting_message")

  if (buttons.length < 1) {
    // disable right side
    sendbar.style.display = 'none'
    current_request_path.style.display = 'none'
    request_data_wrapper.style.display = 'none'
    starting_message.style.display = 'flex'
  } else {
    // enable right side
    sendbar.style.display = 'flex'
    current_request_path.style.display = 'block'
    request_data_wrapper.style.display = 'block'
    starting_message.style.display = 'none'
  }

  let tabs = document.getElementsByClassName("request_tabbutton")
  app.opened_tabs = []
  for (let tab of tabs) {
    // неправльно, табы должны быть в памяти ВСЕГДА, т.к. в них вся инфа по запросу.
    // or is it?
    // every tab is a structure, saved on a disc
    // opened a tab = read a file
    // saved a tab = wrote a file
    // closed a tab = asked if wanna save
    // created a tab = *nothing*
    // shared a tab
    // so I can safely recreate tabs like this
    app.opened_tabs.push(tab.id)
  }
  
}
  
function window_resize_trigger() {
  adjust_main_tabbar_buttons()
}

let u


async function add_request(event, data) { // pass data.id to generate request data with a specific id
  if (app.current_tab) {
    let request = await build_request()
    app.current_request = JSON.parse(JSON.stringify(request))

    let current_tab = document.getElementById(app.current_tab)
    // if ther are no tabs yet, there are no current tab
    let is_modified = JSON.parse(current_tab?.getAttribute("modified") || "false") // old tab
    //let is_modified = JSON.parse(current_tab.getAttribute("modified"))
    //console.log("setting modified inside tab_click", is_modified) 
    if (current_tab) {
      if (is_modified) { // true/false shenanigans
        await write_request_file(app.current_tab, true)
      } else {
        await write_request_file(app.current_tab)
      }
    } else {
      console.log("add_request: no current_tab")
    }
  }  

  let request_id = data?.id || crypto.randomUUID()
  let request_name = "New Request" //+ " " + app.opened_tabs.length
  
  let container = document.getElementById("request_body_wrapper")
  let tables = container.getElementsByClassName("request_params_table")

  for (let table of tables) {
    table.innerHTML = "<tr><th>✅</th><th>Key</th><th>Value</th><th>Description</th><th>🗑️</th></tr>" 
    console.log("add request")
    add_row(null, table)
  }

  let tab_button = document.createElement('button')
  tab_button.classList.add("request_tabbutton")  
  tab_button.innerHTML = request_name + '<span class="close_button">❌</span>'
  tab_button.id = request_id
  tab_button.addEventListener("click", request_tab_click)
  
  app.opened_tabs.push(request_id)
  app.current_tab = request_id
  let request_bar_scroll_area = document.getElementById('request_bar_scroll_area')
  request_bar_scroll_area.appendChild(tab_button)
  request_bar_scroll_area.scrollBy(Number.MAX_SAFE_INTEGER, 0)    
  // set modified flag, cause it's not saved
  set_modified(request_id, true)

  await manage_tab_history(true) // pass true to indincate this is a new tab
  adjust_main_tabbar_buttons()
}


function show_auth_tab(id) {
  let auth_right_side = document.getElementById("auth_right_side")
  let tabpanels = auth_right_side.getElementsByClassName("tabpanel")

  for (let tabpanel of tabpanels) {
    if (tabpanel.id == "auth_panel_"+id) {
      tabpanel.style.display = "block";
    } else {
      tabpanel.style.display = "none";
    }    
  }
}


async function select_file() {
  // Open a dialog
  const file = await app.open_dialog({
    multiple: false,
    directory: false,
  });


  if (file) {
    let body_binary_file_input_label = document.getElementById('body_binary_file_input_label')
    let body_binary_file_input = document.getElementById('body_binary_file_input')
    body_binary_file_input_label.textContent = file.path
    body_binary_file_input.value = file.name
    body_binary_file_input.setAttribute("filename", file.path)
  }
  
  console.log(" - file - ",file);
}

async function save_opened_tabs() {
  console.log('saving opened tabs')
  let filename = "opened_tabs.json"
  await app.writeTextFile(filename, JSON.stringify(app.opened_tabs, null, 2), { baseDir: 15 }) // localappdata
}

async function load_previoursly_opened_tabs() {
  // loading history
  let filename = "opened_tabs.json"
  let data = await app.readTextFile(filename, { baseDir: 15 }) // localappdata
  let json_data = JSON.parse(data)
  let last_id
  for (let d of json_data) {
    console.log("found file", d)
    // need to^
    // 1. add a tab button
    // 2. assign it and id
    // 3. when all done - click the last one
    // 4. possibe fill the history
    let request_data 
    try {
       request_data = await read_request_file(d)
    } catch(err) {
      console.log("couldn't read request data", err)
    }
    let tab_button = document.createElement('button')
    tab_button.classList.add("request_tabbutton")  
    tab_button.innerHTML = (request_data?.name || "New Request") + '<span class="close_button">❌</span>'
    tab_button.id = d
    tab_button.addEventListener("click", request_tab_click)
    
    app.opened_tabs.push(d)
    app.tab_history.push(d)
    app.current_tab = d
    app.current_request = request_data
    let request_bar_scroll_area = document.getElementById('request_bar_scroll_area')
    request_bar_scroll_area.appendChild(tab_button)
    request_bar_scroll_area.scrollBy(Number.MAX_SAFE_INTEGER, 0)    
    // set modified flag, cause it's not saved
    if (request_data?.modified === false) { 
      set_modified(d, false)
    } else {
      set_modified(d, true)
    }
    last_id = tab_button
  }

  fill_in_forms()
  last_id.click()
  // let request_bar_scroll_area = document.getElementById("request_bar_scroll_area")
  // let buttons = request_bar_scroll_area.getElementsByClassName("request_tabbutton")
  // for (let button of buttons) {
    
  // }
}

// treeview ===============================
let ppp

function checkOverflow() {
    if (this.scrollWidth > this.clientWidth) {
        this.style.overflowX = 'auto'
    } else {
        this.style.overflowX = 'hidden'
    }
}

function get_random_request_type() {
    let types = ["GET", "POST", "PUT", "UPDATE", "REPORT", "HEAD", "OPTIONS"]
    return types[Math.floor(Math.random()*types.length)]
}

function toggle_children_display(target) {

    target.setAttribute("opened", !JSON.parse(target.getAttribute("opened")) || "false")
    // let divs = this.getElementsByTagName("div")
    // for (let d of divs) {
    //     if (d == this) {continue}
    //     if (d.style.display == 'none') {
    //         d.style.display = 'block'
    //     } else {
    //         d.style.display = 'none'
    //     }
    // }
    event?.stopPropagation(); 
}

let currently_selected_tree_node

function tree_item_click(event) {
    console.log(event)
    let target = event.target
    while (!target.classList.contains('treeitem')) {
      target = target.parentElement
    }
    
    
    if (target.classList.contains("folder")) {
        toggle_children_display(target)
    }
    event.stopPropagation()
}

function select_tree_item(event, element) {
  let treeview1 = document.getElementById("treeview1")
  let items = treeview1.getElementsByClassName("treeitem")
  let target = element || this
  while (!target.classList.contains('treeitem')) {
    target = target.parentElement
  }
  
  currently_selected_tree_node = target || this
  for (let item of items) {
      if (item == currently_selected_tree_node) {
        item.setAttribute("selected", true)
      } else {
        item.setAttribute("selected", false)
      }
  }

  if (currently_selected_tree_node.classList.contains('request')) {
    let navbar = document.getElementById("requests_tabbar")
    let buttons = navbar.getElementsByClassName('request_tabbutton')
    let found_opened_tab
    for (let button of buttons) {
      if (button.id == currently_selected_tree_node.id) {
        button.click()
        found_opened_tab = true
        break
      }
    }

    if (!found_opened_tab) {
      //
      add_request(event, {id : currently_selected_tree_node.id})
    }
  }   
}

let treeview_item_menu_callee

function context_menu(event) {
    let target = event.target
    let treeitem_context = document.getElementById("treeitem_context")
    treeitem_context.style.display = 'none'
    let treeview1 = document.getElementById("treeview1")
    let items = treeitem_context.getElementsByClassName("dropdown-item")
    console.log(target.classList)
        for (let item of items) {
            let value = item.getAttribute('value')
            if (target.classList.contains("request") || target.parentElement.classList.contains("request")) {
                if (value == "add_request" || value == "add_folder") {
                    item.style.display = 'none'
                }
            } else {
                if (value == "add_request" || value == "add_folder") {
                    item.style.display = 'flex'
                }
            }
        }
    //console.log(event)
    //console.log(event.clientY, treeview1.clientHeight, treeitem_context.children[0].clientHeight)
    treeitem_context.style.top = Math.min(event.clientY - 24, treeview1.clientHeight - treeitem_context.children[0].clientHeight - 24) + 'px'
    treeitem_context.style.left = Math.min(event.clientX - 5, treeview1.clientWidth - treeitem_context.children[0].clientWidth - 5) + 'px'
    treeitem_context.style.display = 'inline-block'
    treeitem_context.children[0].style.display = 'block'
    treeview_item_menu_callee = target
    //tree_item_click(event)
    event.stopPropagation()
    event.preventDefault()
}

function select_request(event) {
    console.log(this)
    select_tree_item(event, this)
    event.stopPropagation(); 
}

function add_item(type, parent) {
    if (this.id == 'add_collection' || this.id == 'context_add_folder') {
      type = 'folder'
      parent = treeview_item_menu_callee
    }

    if (this.id == 'context_add_request') {
      type = 'request'
      parent = treeview_item_menu_callee
    }

    if (parent) {
      while (!parent.classList.contains('folder')) {
        parent = parent.parentElement
      }
    }

    let item = document.createElement("div")
   

    if (type=="folder") {
        item.classList.add("folder")
        item.classList.add("treeitem")
        let icon = document.createElement("span")
        icon.classList.add('folder-icon')
        item.appendChild(icon)
        let text = document.createElement("span")
        text.classList.add('item-text')
        text.textContent = "New Folder" 
        item.appendChild(text)
        item.setAttribute("opened", true)
        icon.addEventListener("click", tree_item_click)
        text.addEventListener("click", select_tree_item)
        item.addEventListener("contextmenu", context_menu)
        type == 'folder'

    } else {
        item.classList.add("request")
        item.classList.add("treeitem")
        let rt = 'GET'//get_random_request_type()

        let req_type = document.createElement("span")
        req_type.classList.add('request-type')
        req_type.classList.add(rt)
        req_type.textContent = rt
        item.appendChild(req_type)
        item.id = crypto.randomUUID()

        let text = document.createElement("span")
        text.classList.add('item-text')
        text.textContent = "New Request" 
        item.appendChild(text)
        text.addEventListener("click", select_request)
        item.addEventListener("contextmenu", context_menu)
    }
    
         

    let pe =  ppp || parent || document.getElementById("treeview1")

    // if (Math.random() > 0.3 && item.classList.contains('folder')) {
    //   ppp = item
    // } else {
    //     ppp = document.getElementById("treeview1")
    // }
    
    // if (item.classList.contains("request") && !pe.classList.contains("folder")) {
    //     console.log("adding folder for a req")
    //    // pe = add_item("folder", pe)
    // }
    console.log(pe, item)
    pe.appendChild(item)
    document.getElementById("treeview1").scrollBy(0, Number.MAX_SAFE_INTEGER)
    return item
}

// treeview ===============================



function init() {  
  // treeview plaecholder
  let treeview1 = document.getElementById("treeview1")
  treeview1.addEventListener("scroll", checkOverflow)
  for (let i=1; i<50; i++) {
      //add_item()
  }
  // --------------------

  console.log('init')
  // enable add_row buttons (those adding rows to param tables)
  let add_row_buttons = document.getElementsByClassName('add_row_button')
  for (let element of add_row_buttons) {
    element.addEventListener("click", add_row);
  }
  
  // enable tab switching for request params tab bar
  let tab_headers = document.getElementsByClassName('tab_header_button')
  for (let element of tab_headers) {
    element.addEventListener("click", open_tab);
  }

  // add ctrl+a functionality to the response output element
  //document.getElementById("response_body").addEventListener("keydown", select_all);
  

  // enable main tab bar scrolling with button presses
  let request_row_right_button = document.getElementById('request_row_right_button')
  let request_row_left_button  = document.getElementById('request_row_left_button')
  request_row_right_button.addEventListener("mousedown", main_scroll_tabbar_start);
  request_row_right_button.addEventListener("mouseup", main_scroll_tabbar_end);
  request_row_left_button.addEventListener("mousedown", main_scroll_tabbar_start);
  request_row_left_button.addEventListener("mouseup", main_scroll_tabbar_end);

  // enable main tab bar scrolling (mousewheel)
  let request_bar_scroll_area = document.getElementById('request_bar_scroll_area')
  request_bar_scroll_area.addEventListener("wheel", main_scroll_tabbar_wheel);

  let body_binary_file_input = document.getElementById('body_binary_file_input')
  body_binary_file_input.addEventListener("click", select_file);

  let send_request_button = document.getElementById('send_request')
  send_request_button.addEventListener("click", send_request);

  init_comboboxes()
  init_menus()
  init_popups()

  // show request query params tab
  let tab_header_buttons = document.getElementsByClassName("tab_header_button")
  for (let button of tab_header_buttons) {
    if (button.checked) {
      let event = new Event('click')
      button.dispatchEvent(event);
    }
  }

  // collection manipulation
  let add_collection = document.getElementById('add_collection')
  let context_add_request = document.getElementById('context_add_request')
  let context_add_folder  = document.getElementById('context_add_folder')
  let context_clone       = document.getElementById('context_clone')
  let context_export      = document.getElementById('context_export')
  let context_delete      = document.getElementById('context_delete')

  add_collection.addEventListener("click", add_item)
  context_add_folder.addEventListener("click", add_item)
  context_add_request.addEventListener("click", add_item)
  
  //---------------------------------------
    
  let beautify_raw_data_body = document.getElementById('beautify_raw_data_body')
  let beautify_raw_data_response = document.getElementById('beautify_raw_data_response')
  beautify_raw_data_body.addEventListener("click", beautify_button_click);
  beautify_raw_data_response.addEventListener("click", beautify_button_click);

  let add_request_button = document.getElementById('add_request_button')  
  let mock_button = document.getElementById('mock_button')  
  add_request_button.addEventListener("click", add_request);
  mock_button.addEventListener("click", add_request);

  

  document.addEventListener("keydown", keyboard_shortcuts_handler);

  setTimeout(()=>{
    let style = document.getElementById("animations")
    style.textContent = '* {transition: all 0.1s;} .tabbar label {transition: all 0.5s;} .editor-container * {transition:none }'
  }, 1000)
    

  //dirty hack for debug
  let event1 = new Event('click')
  body_editor.setValue('<label><input type="radio" name="request_params_tabbar_body" value="none"                  class="tab_header_button" checked >none</label>')
  

  window.addEventListener("resize", window_resize_trigger)
}

window.onload = init

try {
  // loading opened earlier tabs
  // this will start happening before the ui is fully loaded 
  await load_previoursly_opened_tabs()
} catch(err) {
  console.log("can't load previous session", err)
}


function fill_mock_data() {  
  let container = document.getElementById("request_body_wrapper")
  let tables = container.getElementsByClassName("request_params_table")

  // for (let table of tables) {
  //   table.innerHTML = "<tr><th>✅</th><th>Key</th><th>Value</th><th>Description</th><th>🗑️</th></tr>" 
  //   add_row(null, table)
  // }

  let auth_panel =  document.getElementById('auth_right_side')
  let auth_inputs = auth_panel.getElementsByClassName("auth_input")

  for (let input of auth_inputs) {
    if (input.classList.contains("username_input")) {
      //input.value = "ezwrk@ntrnx.ru"
    }
    if (input.classList.contains("password_input")) {
      //input.value = "7VOlvV3frvhYJhDiHNf/xh6p"
    }
    if (input.classList.contains("token_input")) {
      input.value = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkE3QTY1NDE0OEM1MjMxRUE3QzAwRUNERDBEMTRDRjBGIiwidHlwIjoiYXQrand0In0.eyJuYmYiOjE3MjAwMTU5NzgsImV4cCI6MTc1MTU1MTk3OCwiaXNzIjoiaHR0cHM6Ly9kZW1vMS1yZWlzLmRldi5udHJueC5jb20iLCJhdWQiOiJSZWNvcmRlciIsImNsaWVudF9pZCI6IlJlY29yZGVyX1NQQSIsInN1YiI6IjQxNDUwYzQ2LTQ3ZmMtNDc1Yi1iNTRiLWE0Mzk2OWUyMzE0NiIsImF1dGhfdGltZSI6MTcyMDAxNTk3OCwiaWRwIjoibG9jYWwiLCJ0ZW5hbnRpZCI6Ijg0MWEyMjEzLTg4NWEtNGM5MS1iYzI3LWVhMzhmNjI3NDE0YiIsImVtYWlsIjoiYWRtaW5AZGVmYXVsdHRlbmFudC5jb20iLCJyb2xlIjpbImFkbWluIiwiUmVnaXN0ZXJlZFVzZXIiXSwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjoiRmFsc2UiLCJlbWFpbF92ZXJpZmllZCI6IlRydWUiLCJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3MjAwMTU5NzgsInNjb3BlIjpbIlJlY29yZGVyIl0sImFtciI6WyJwd2QiXX0.YFaSFpTEo4KvsbHDQoooYoDNcIbLFr3x09TT0jB_pzJpl_00oIrgmc2GTzk5XNsWEl-Bq5m8quIA9VVHtwfJrJlSDjWg2MIpt-WrPD9r68BbMQNFuNjthyzfkiUvr06yANjSMbtMY-395EGRKck3g7Ro97CW_0qXdrc5GspO8yAJMdBWN_OtdK1fyUYr1Ai7TvxrGAFllMHQdBmhFvni8VZDksgv9fCaFBLkyOFpMgMyMy1L8zHc68XxIOVTLYdxG7jr90HCy1EZjOvX6C5qtiJEXqXD_2l1sASrUjG_R6oELoB07m4Q-nJ6_WH9eSpUXVksfSP0w7MaZvfC8S3jTQ"
    }
  }

  let url_input = document.getElementById("url_input")   
  url_input.value = "https://demo1-recorder-api.dev.ntrnx.com/api/recorder/settings/notifications?api-version=1.0"
  url_input.value = "https://demo1-recorder-api.dev.ntrnx.com/api/recorder/video/page?api-version=1.0&pageNumber=1&pageSize=10&countTotal=true"
  //url_input.value = "https://192.168.1.113:8443/web/save_isap_config"
  //url_input.value = "http://reconf-ad-2.dev.ntrnx.local/Ews/Exchange.asmx"
  //url_input.value = "https://192.168.1.113:8443/api/hw-monitor"
  //url_input.value = "https://wrong.host.badssl.com/"

  let auth_type_select = document.getElementById("auth_type_select") 
  auth_type_select.value = 'bearer'
  //auth_type_select.value = 'basic'

  let body_type_select = document.getElementById("auth_type_select") 
  auth_type_select.value = 'bearer'

}





// fetch a long response ("send and download")
// async function fetchData() {
//   const url = "https://www.dl.dropboxusercontent.com/s/7d87jcsh0qodk78/fuel_64x64x64_uint8.raw?dl=1";
//   const response = await fetch(url);
//   const reader = response.body.getReader();
  
//   let length = 0;
//   let value, done;
//   while ({value, done} = await reader.read(), !done) {
//     length += value.length;
//   }
//   console.log(length);
// }

// fetchData()


// async function run() {
//   let fdb = new FormData()
//   fdb.append("1", "2")
//   fdb.append("3", "4")
  
  
//   console.log(await (await app.fetch("https://httpbin.org/post", {
//     headers : {
//       // "Content-Type" : "multipart/form-data",
//       "accept" : "*/*"
//     },
//     method :"POST",
//     body : fdb
//   })).text())
// }


// await run()


//contextmenu event listener


