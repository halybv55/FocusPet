(function () {
  "use strict";

  var cfg = window.APP_CONFIG || {};
  var SUPABASE_URL = (cfg.SUPABASE_URL || "").replace(/\/+$/, "");
  var SUPABASE_KEY = cfg.SUPABASE_PUBLIC_KEY || "";
  var TABLE = "beta_signups";

  // Nombre de la app (se cambia en config.js)
  if (cfg.APP_NAME) {
    document.querySelectorAll("[data-app-name]").forEach(function (el) { el.textContent = cfg.APP_NAME; });
    document.title = cfg.APP_NAME + " – Divide tus tareas grandes en pasos pequeños";
  }

  var form = document.getElementById("beta-form");
  var btn = document.getElementById("submit-btn");
  var msg = document.getElementById("form-message");
  var necesidad = document.getElementById("necesidad");
  var counter = document.getElementById("necesidad-count");

  necesidad.addEventListener("input", function () { counter.textContent = necesidad.value.length; });

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(id, text) {
    var field = document.getElementById(id).closest(".field");
    var err = document.getElementById("error-" + id);
    err.textContent = text || "";
    if (text) { field.classList.add("invalid"); } else { field.classList.remove("invalid"); }
    document.getElementById(id).setAttribute("aria-invalid", text ? "true" : "false");
  }

  function validate(values) {
    var ok = true;
    var firstBad = null;
    function bad(id, text) { setError(id, text); ok = false; if (!firstBad) firstBad = id; }

    if (values.nombre.length < 2) bad("nombre", "Escribe tu nombre (mínimo 2 letras)."); else setError("nombre", "");
    if (!EMAIL_RE.test(values.correo)) bad("correo", "Escribe un correo válido, por ejemplo nombre@correo.com."); else setError("correo", "");
    if (!values.perfil) bad("perfil", "Selecciona tu perfil."); else setError("perfil", "");
    if (values.institucion.length > 100) bad("institucion", "Máximo 100 caracteres."); else setError("institucion", "");
    if (values.necesidad.length < 10) bad("necesidad", "Cuéntanos un poco más (mínimo 10 caracteres)."); else setError("necesidad", "");
    if (!values.interes) bad("interes", "Selecciona tu nivel de interés."); else setError("interes", "");
    if (!values.privacidad) bad("privacidad", "Debes aceptar para poder inscribirte."); else setError("privacidad", "");

    if (firstBad) document.getElementById(firstBad).focus();
    return ok;
  }

  function showMessage(type, text) {
    msg.className = "message " + type;
    msg.textContent = text;
  }

  function configured() {
    return SUPABASE_URL.indexOf("https://") === 0 && SUPABASE_URL.indexOf("TU-PROYECTO") === -1 &&
           SUPABASE_KEY && SUPABASE_KEY.indexOf("PEGA_") === -1;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msg.className = "message";
    msg.textContent = "";

    var values = {
      nombre: form.nombre.value.trim(),
      correo: form.correo.value.trim().toLowerCase(),
      perfil: form.perfil.value,
      institucion: form.institucion.value.trim(),
      necesidad: form.necesidad.value.trim(),
      interes: form.interes.value,
      privacidad: form.privacidad.checked
    };

    if (!validate(values)) {
      showMessage("fail", "Revisa los campos marcados e inténtalo de nuevo.");
      return;
    }

    // Anti-spam: si el campo trampa tiene texto, fingimos éxito sin guardar nada.
    if (form.sitio_web.value) {
      showMessage("success", "¡Listo! Te inscribiste a la beta.");
      form.reset();
      return;
    }

    if (!configured()) {
      showMessage("fail", "La conexión con la base de datos aún no está configurada (revisa config.js).");
      return;
    }

    var payload = {
      nombre: values.nombre,
      correo: values.correo,
      perfil: values.perfil,
      institucion: values.institucion || null,
      necesidad: values.necesidad,
      interes: values.interes,
      acepta_privacidad: true
    };

    var headers = {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Prefer": "return=minimal" // evita necesitar permiso de lectura
    };
    // Las claves anon antiguas son JWT (empiezan con "eyJ"); las nuevas "sb_publishable_" solo usan apikey.
    if (SUPABASE_KEY.indexOf("eyJ") === 0) headers["Authorization"] = "Bearer " + SUPABASE_KEY;

    btn.disabled = true;
    btn.textContent = "Enviando...";

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 15000);

    fetch(SUPABASE_URL + "/rest/v1/" + TABLE, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    })
      .then(function (res) {
        if (res.status === 201 || res.status === 200 || res.status === 204) {
          showMessage("success", "¡Listo, " + values.nombre.split(" ")[0] + "! Te inscribiste a la beta. Te escribiremos al correo que dejaste.");
          form.reset();
          counter.textContent = "0";
        } else if (res.status === 409) {
          showMessage("fail", "Ese correo ya está inscrito. ¡Gracias por tu interés!");
        } else {
          showMessage("fail", "No pudimos guardar tu inscripción. Inténtalo de nuevo en unos minutos.");
        }
      })
      .catch(function () {
        showMessage("fail", "Parece que no hay conexión. Revisa tu internet e inténtalo otra vez.");
      })
      .finally(function () {
        clearTimeout(timer);
        btn.disabled = false;
        btn.textContent = "Inscribirme a la beta";
      });
  });
})();
