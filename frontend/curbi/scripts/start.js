/**
 * Levanta la API y el frontend con un solo comando.
 *
 * La idea es que nunca haya que acordarse de abrir dos terminales: al correr
 * `npm start` en el frontend, esta comprueba si el backend y el frontend ya
 * estan levantados y, si no, arranca los que falten como hijos. Si el usuario
 * ya los tenia abiertos a mano, no se lanza un segundo proceso que pelee por el
 * puerto.
 */
const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

const API_PORT = Number(process.env['CURBI_API_PORT'] || 4000);
const WEB_PORT = Number(process.env['CURBI_WEB_PORT'] || 4200);
const backendDir = path.resolve(__dirname, '..', '..', '..', 'backend');
const raizFrontend = path.resolve(__dirname, '..');

const verde = (t) => `\x1b[32m${t}\x1b[0m`;
const rojo = (t) => `\x1b[31m${t}\x1b[0m`;
const azul = (t) => `\x1b[36m${t}\x1b[0m`;

/** Un intento de conexion contra un host. */
function probarHost(port, host) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const cerrar = (ocupado) => {
      socket.destroy();
      resolve(ocupado);
    };
    socket.setTimeout(1000);
    socket.once('connect', () => cerrar(true));
    socket.once('timeout', () => cerrar(false));
    socket.once('error', () => cerrar(false));
  });
}

/**
 * Resuelve en true si algo ya escucha en el puerto.
 *
 * Se prueban IPv4 e IPv6 porque no es lo mismo: `ng serve` resuelve localhost a
 * ::1 y ahi no responde un connect a 127.0.0.1, asi que preguntar por IPv4 nomas
 * daba "libre" con el puerto tomado y el frontend reventaba igual. Los dos
 * intentos van en paralelo para no sumar un segundo de arranque.
 */
function puertoOcupado(port) {
  return Promise.all([probarHost(port, '127.0.0.1'), probarHost(port, '::1')]).then(
    (resultados) => resultados.some(Boolean),
  );
}

const hijos = [];

/**
 * Levanta un proceso con el entry point del modulo, sin pasar por npm ni por
 * shell: en Windows, `npm.cmd` con shell:true dispara el aviso DEP0190 de Node
 * (los argumentos no se escapan, solo se concatenan) y obliga a comillas
 * manuales. Llamando a node con la ruta del CLI se evita las dos cosas.
 */
function lanzar(etiqueta, modulo, args, cwd) {
  // `paths: [cwd]` importa: tsx vive en backend/ y el ng CLI en frontend/, asi
  // que resolver sin esto buscaria los dos desde el frontend y tsx no se
  // encontraria.
  const rutaCli = require.resolve(modulo, { paths: [cwd] });
  const hijo = spawn(process.execPath, [rutaCli, ...args], {
    cwd,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const prefijo = etiqueta === 'api' ? azul('[api]') : etiqueta === 'web' ? verde('[web]') : `[${etiqueta}]`;

  const reenviar = (flujo, destino) => {
    let resto = '';
    flujo.setEncoding('utf8');
    flujo.on('data', (trozo) => {
      resto += trozo;
      const lineas = resto.split(/\r?\n/);
      resto = lineas.pop() ?? '';
      for (const linea of lineas) {
        destino.write(`${prefijo} ${linea}\n`);
      }
    });
  };

  reenviar(hijo.stdout, process.stdout);
  reenviar(hijo.stderr, process.stderr);
  hijos.push(hijo);
  return hijo;
}

function apagarTodos(codigo = 0) {
  for (const hijo of hijos) {
    if (!hijo.killed) {
      try {
        hijo.kill();
      } catch {
        // Si el proceso ya no existe, no hay nada que cerrar.
      }
    }
  }
  process.exit(codigo);
}

async function main() {
  const ocupadoApi = await puertoOcupado(API_PORT);
  let api = null;

  if (ocupadoApi) {
    console.log(
      azul(`[api] `) +
        `ya hay un backend escuchando en el puerto ${API_PORT}; no se levanta otro.`,
    );
    // El backend corre con tsx, que NO recarga solo. Reutilizar el proceso
    // viejo despues de editar codigo hace que se pruebe una version que ya no
    // existe, y el sintoma sale como un error de negocio raro (un POST que
    // deberia fallar pasa, o al reves) en vez de como "el servidor esta viejo".
    console.log(
      azul(`[api] `) +
        `OJO: ese backend no recarga solo. Si cambiaste codigo del backend, ` +
        `cierra el proceso del puerto ${API_PORT} y corre npm start otra vez.`,
    );
  } else {
    console.log(azul('[api] ') + `levantando el backend en el puerto ${API_PORT}...`);
    api = lanzar('api', 'tsx/cli', ['server.ts'], backendDir);
    api.on('exit', (code) => {
      console.log(rojo(`[api] `) + `el backend se detuvo (codigo ${code}).`);
      apagarTodos(code ?? 0);
    });
  }

  // El puerto del frontend se revisa con la misma logica que el de la API. Sin
  // esto, ng serve tiraba un stack larguisimo de Angular y se llevaba por
  // delante al backend tambien, cuando en realidad solo faltaba avisar que ya
  // habia un frontend escuchando.
  const ocupadoWeb = await puertoOcupado(WEB_PORT);
  let web = null;

  if (ocupadoWeb) {
    console.log(
      verde(`[web] `) +
        `ya hay un frontend escuchando en el puerto ${WEB_PORT}; no se levanta otro.`,
    );
    console.log(verde('[web] ') + `abrilo en http://localhost:${WEB_PORT}  (Ctrl+C para salir)`);
  } else {
    console.log(verde('[web] ') + `levantando el frontend en el puerto ${WEB_PORT}...`);
    // Se invoca ng directamente, no `npm start`: este script ES el npm start del
    // frontend, asi que llamarse a si mismo seria un bucle infinito.
    web = lanzar('web', '@angular/cli/bin/ng.js', ['serve', '--port', String(WEB_PORT)], raizFrontend);
    web.on('exit', (code) => {
      console.log(rojo(`[web] `) + `el frontend se detuvo (codigo ${code}).`);
      apagarTodos(code ?? 0);
    });
  }

  // Ctrl+C cierra lo que se levanto aqui, para no dejar un hijo huerfano
  // ocupando su puerto.
  process.on('SIGINT', () => apagarTodos(0));
  process.on('SIGTERM', () => apagarTodos(0));
}

main().catch((error) => {
  console.error(rojo('No se pudo iniciar el proyecto:'), error);
  apagarTodos(1);
});
