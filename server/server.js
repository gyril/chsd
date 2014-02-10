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

var r = [ "url", "util", "fs", "http", "querystring", "nodemailer" ];
for (var i = 0; i < r.length; i++) { 
  global[r[i]] = require(r[i]); 
}

var readFile = fs.readFile;
var transport = nodemailer.createTransport("SMTP", {
	host: "smtp.gmail.com", // hostname
    secureConnection: true, // use SSL
    port: 465, // port for secure SMTP
    auth: {
        user: "maternite.delafontaine@gmail.com",
        pass: "chsdgadu140"
    }});
    
function sendMail(form) {
	
	if(form.id == "consultation") {
		var motif = parseInt(form.inputObjet);
		
		var objet = [
						"Autre",
						"PMA & stérilité",
						"Cancer du sein",
						"Mutilations sexuelles",
						"Chirurgie gynécologique",
						"Planning Familial"
					];
					
		var adresses = [
						"cellule.telephonique@ch-stdenis.fr",
						"centre.pma@ch-stdenis.fr",
						"cellule.telephonique@ch-stdenis.fr",
						"secretariat.deux@ch-stdenis.fr",
						"cellule.telephonique@ch-stdenis.fr",
						"cellule.telephonique@ch-stdenis.fr"
					];
					
		var content = "Mme/Mlle <strong>"+form.inputPrenom+" "+form.inputNom+"</strong><br>"
					+ "joignable au <strong>"+form.inputTel+"</strong> ou par e-mail à l'adresse "+form.inputMail+"<br>"
					+ "souhaite consulter en <strong>"+objet[motif]+"</strong><br>"
					+ "Elle fournit les précisions suivantes :<br>"+form.inputPrecisions;
					
		transport.sendMail({
		    from: "'Maternité Angélique du Coudray' maternite.delafontaine@gmail.com",
		    to: adresses[motif],
		    subject: "["+objet[motif]+"] Demande de consultation",
		    html: content
		});
		
	} else if(form.id == "accouchement") {
		var couverture = (form.optionsCouverture == "Vide") ? "aucune couverture" : (form.optionsCouverture == "SS") ? "Sécurité Sociale" : form.optionsCouverture; 
		var content = "Mme/Mlle <strong>"+form.inputPrenom+" "+form.inputNom+"</strong> (née <strong>"+form.inputNomJF+"</strong>, le "+form.inputNaissanceJ+"/"+form.inputNaissanceM+"/"+form.inputNaissanceA+")<br>"
					+ "joignable au <strong>"+form.inputTel+"</strong> ou par e-mail à l'adresse "+form.inputMail+"<br>"
					+ "a rempli en ligne une demande d'inscription à l'accouchement.<br>"
					+ "La date d'accouchement prévue est le "+form.inputAccJ+"/"+form.inputAccM+"/"+form.inputAccA+".<br>"
					+ "Elle indique la couverture sociale suivante : <strong>"+couverture+"</strong>.";
		
		console.log(content);			
		transport.sendMail({
		    from: "'Maternité Angélique du Coudray' maternite.delafontaine@gmail.com",
		    to: "cellule.telephonique@ch-stdenis.fr",
		    subject: "Demande d'inscription pour un accouchement",
		    html: content
		});
		 
	} else if(form.id =="acces") {
		var content = "L'adresse e-mail : <strong>"+form.inputMail+"</strong> souhaite obtenir un code d'accès à la partie professionnelle.<br>"
		
		transport.sendMail({
		    from: "'Maternité Angélique du Coudray' maternite.delafontaine@gmail.com",
		    to: "ghada.hatem@ch-stdenis.fr", //autre?
		    subject: "[Accès professionnel] Demande d'accès",
		    html: content
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

    util.puts("loading " + filename + "...");
    readFile(filename, function (err, data) {
      if (err) {
        util.puts("Error loading " + filename);
      } else {
        body = data;
        headers = { "Content-Type": content_type
                  , "Content-Length": body.length
                  };
        if (!DEBUG) headers["Cache-Control"] = "public";
        util.puts("static file " + filename + " loaded");
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

var getMap = {};

getMap['/submit.html'] = function (req, res) {
	console.log(req.method);
	
	if(req.method == "POST") {

	}
	return;
};

function checkFile(name) {
	if(name == "" || name == "/")
  		name = "/index.html";
  		
	return staticHandler(".."+name);
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