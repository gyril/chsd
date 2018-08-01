HOST = null;
PORT = 8070;
DEBUG = false;
var NOT_FOUND = "Uh oh -- no file found...\n";

function notFound(req, res) {
  res.writeHead(404, { "Content-Type": "text/plain"
                     , "Content-Length": NOT_FOUND.length
                     });
  res.end(NOT_FOUND);
}


var starttime = (new Date()).getTime();

var r = [ "url", "util", "fs", "http", "querystring" ];
for (var i = 0; i < r.length; i++) { 
  global[r[i]] = require(r[i]); 
}

var sendgridKey = (process.env.SENDGRID_KEY || 'SG.testKey');
var sendgrid = require('sendgrid')(sendgridKey);

var readFile = fs.readFile;
    
function sendMail(form) {
	
	if(form.id == "consultation") {
		var motif = parseInt(form.inputObjet);
		
		var objet = [
						"Autre",
						"PMA & stérilité",
						"Cancer du sein",
						"Mutilations sexuelles",
						"Chirurgie gynécologique",
						"Planning Familial",
						"Fuites urinaires & descente d'organes",
						"Endométriose"
					];
					
		var adresses = [
						"cellule.telephonique@ch-stdenis.fr",
						"centre.pma@ch-stdenis.fr",
						"cellule.telephonique@ch-stdenis.fr",
						"secretariat.deux@ch-stdenis.fr",
						"cellule.telephonique@ch-stdenis.fr",
						"planning@ch-stdenis.fr",
						"cellule.telephonique@ch-stdenis.fr",
						"cellule.telephonique@ch-stdenis.fr"
					];
					
		var content = "Mme/Mlle <strong>"+form.inputPrenom+" "+form.inputNom+"</strong>, née le "+form.inputNaissanceJ+"/"+form.inputNaissanceM+"/"+form.inputNaissanceA+"<br>"
					+ "joignable au <strong>"+form.inputTel+"</strong> ou par e-mail à l'adresse "+form.inputMail+"<br>"
					+ "souhaite consulter en <strong>"+objet[motif]+"</strong><br>"
					+ "Elle fournit les précisions suivantes :<br>"+form.inputPrecisions
					+ "<br><br><br><em>Ce message est envoyé automatiquement, il est inutile d'y répondre.</em>";
		
		sendgrid.send({ 
			to: adresses[motif],
			from: 'no-reply@maternite-delafontaine.fr',
			subject: '['+objet[motif]+'] Demande de consultation', 
			html: content
		}, function (err, json) { 
			if (err) { return console.error(err); } 
			
			console.log('Message sent', json);
		});
		
	} else if(form.id == "accouchement") {
		var couverture = (form.optionsCouverture == "Vide") ? "aucune couverture" : (form.optionsCouverture == "SS") ? "Sécurité Sociale" : form.optionsCouverture; 
		var content = "Mme/Mlle <strong>"+form.inputPrenom+" "+form.inputNom+"</strong> (née <strong>"+form.inputNomJF+"</strong>, le "+form.inputNaissanceJ+"/"+form.inputNaissanceM+"/"+form.inputNaissanceA+")<br>"
					+ "joignable au <strong>"+form.inputTel+"</strong> ou par e-mail à l'adresse "+form.inputMail+"<br>"
					+ "a rempli en ligne une demande d'inscription à l'accouchement.<br>"
					+ "La date d'accouchement prévue est le "+form.inputAccJ+"/"+form.inputAccM+"/"+form.inputAccA+".<br>"
					+ "Elle indique la couverture sociale suivante : <strong>"+couverture+"</strong>."
					+ "<br><br><br><em>Ce message est envoyé automatiquement, il est inutile d'y répondre.</em>";
		
		console.log(content);

		sendgrid.send({ 
			to: 'cellule.telephonique@ch-stdenis.fr',
			from: 'no-reply@maternite-delafontaine.fr',
			subject: 'Demande d\'inscription pour un accouchement',
			html: content
		}, function (err, json) { 
			if (err) { return console.error(err); } 
			
			console.log('Message sent', json);
		});
		 
	} else if(form.id =="acces") {
		var content = "L'adresse e-mail : <strong>"+form.inputMail+"</strong> souhaite obtenir un code d'accès à la partie professionnelle.<br>"
		
		sendgrid.send({ 
			to: 'ghada.hatem@ch-stdenis.fr',
			from: 'no-reply@maternite-delafontaine.fr',
			subject: '[Accès professionnel] Demande d\'accès',
			html: content
		}, function (err, json) { 
			if (err) { return console.error(err); } 
			
			console.log('Message sent', json);
		});
	}
}
	
function extname (path) {
  var index = path.lastIndexOf(".");
  return index < 0 ? "" : path.substring(index);
}

function mimeType(file) {
	switch(extname(file)) {
		case ".json":
			return "text/json";
			break;		
		case ".js":
			return "text/javascript";
			break;
		case ".otf":
			return "font/opentype";
			break;
		case ".html":
			return "text/html";
			break;
		case ".pdf":
			return "application/pdf";
			break;
		case ".css":
			return "text/css";
			break;
		case ".ico":
			return "image/ico";
			break;
		case ".jpg":
			return "image/jpeg";
			break;
		default:
			return "text/plain";
			break;
	}
}

function staticHandler(filename) {
  var body, headers;
  var content_type = mimeType(filename);

  function loadResponseData(callback) {
    if (body && headers && !DEBUG) {
      callback();
      return;
    }

    readFile(filename, function (err, data) {
      if (err) {
        console.log("Error loading " + filename);
      } else {
        body = data;
        headers = { "Content-Type": content_type
                  , "Content-Length": body.length
                  };
        if (!DEBUG) headers["Cache-Control"] = "public";
        callback();
      }
    });
  }

  return function (req, res) {
    loadResponseData(function () {
      res.writeHead(200, headers);
      res.end(req.method === "HEAD" ? "" : body);
    });
  }
};

function checkFile(name) {
	if(name == "" || name == "/")
  		name = "/index.html";
  		
	return staticHandler("."+name);
}

function loadJSON(file) {
	return fs.existsSync(file) ? require(file) : {};
}

var server = http.createServer(function(req, res) {
	if (req.method === "POST") {
	  	var body = "";
		req.on('data', function (data) {
			body += data;
		});
		req.on('end', function () {
			var form = querystring.parse(body);
			console.log(form);
			if(form.id == "accouchement" || form.id == "consultation" || form.id == "acces")
				sendMail(form);
		});
	}
	
	var handler = checkFile(url.parse(req.url).pathname) || notFound;

    handler(req, res);

});

server.listen(Number(process.env.PORT || PORT), HOST);
