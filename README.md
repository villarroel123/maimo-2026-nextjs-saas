# Narabi

Narabi es una plataforma web pensada para organizar comunidades de fans de K-pop alrededor de conciertos, fanbases y fanprojects. El proyecto permite centralizar propuestas, votaciones, publicaciones, conversaciones y fechas importantes para que la organización de una comunidad no dependa de información dispersa en distintas redes sociales.

La aplicación comenzó a partir de una base SaaS con Next.js y Firebase. Sobre esa estructura inicial se reemplazó la entidad genérica de ejemplo por un dominio propio compuesto por conciertos, fanprojects, fanbases, usuarios, votos, comentarios, solicitudes, favoritos y notificaciones. El resultado es una aplicación con páginas públicas, perfiles personales y paneles privados diferentes según el rol de cada cuenta.

## Objetivo del proyecto

El objetivo principal de Narabi es facilitar la coordinación entre fans antes y durante un concierto. Una persona puede buscar conciertos, conocer los fanprojects propuestos, votar por una idea, comentar, responder a otros usuarios y guardar actividades en su agenda. También puede seguir fanbases para personalizar el contenido que ve.

Las fanbases disponen de herramientas para administrar solamente su comunidad: revisar seguidores, aceptar o rechazar solicitudes, publicar contenido, crear fanprojects y gestionar sus votaciones. Los administradores generales tienen una vista global del sistema y pueden gestionar todos los datos de la plataforma.

## Tecnologías utilizadas

- **Next.js 16.3.1** con App Router.
- **React 19.2.8** para la interfaz y los componentes interactivos.
- **JavaScript** como lenguaje principal.
- **Tailwind CSS 4** para estilos, diseño adaptable y sistema visual.
- **Firebase Authentication** para correo/contraseña y acceso con Google.
- **Firebase Admin SDK** para validar sesiones y operar de forma segura desde el servidor.
- **Cloud Firestore** como base de datos.
- **Google Maps JavaScript API y Places API (New)** para buscar estadios y teatros.
- **Font Awesome** para los iconos de navegación y acciones.
- **Resend** como integración opcional para notificaciones por correo.
- **Vercel** como plataforma prevista para el despliegue.

## Cómo fue construido

El proyecto se desarrolló utilizando la arquitectura de App Router de Next.js. Las páginas se implementaron como Server Components siempre que no necesitaban interacción directa del navegador. Esto permite consultar Firestore en el servidor y entregar la información inicial ya preparada. Los componentes que requieren estado, eventos, ventanas emergentes, filtros o actualizaciones inmediatas se definieron como Client Components.

La lógica no se concentró dentro de las vistas. Las consultas y operaciones de cada área se separaron en módulos dentro de `lib`: `projects` administra conciertos y fanprojects, `fanbases` administra comunidades y miembros, `votes` procesa votaciones, `comments` reúne los distintos sistemas de conversación, `favorites` construye la agenda personal y `users` controla perfiles, roles y permisos. De esta manera, las páginas se ocupan principalmente de componer la interfaz.

Las operaciones de escritura se realizan mediante Server Actions o endpoints internos. Antes de modificar información se vuelve a comprobar la sesión y el nivel de acceso en el servidor. No se confía únicamente en ocultar botones desde la interfaz: las funciones `requireAdmin` y `requireFanbaseAdmin` impiden que una persona sin permisos ejecute acciones administrativas aunque intente llamar directamente a una ruta.

Durante el desarrollo también se optimizaron las interacciones de votos, reacciones y comentarios para evitar recargas completas. Los componentes mantienen una respuesta visual inmediata y luego sincronizan los cambios con el servidor. Las consultas independientes se ejecutan en paralelo cuando es posible y se limitan los documentos recuperados en conversaciones y publicaciones.

## Estructura general

```txt
app/
  api/                     Sesión y endpoints internos
  dashboard/               Paneles privados y administración
  fanbases/                Listado y detalle de fanbases
  favorites/               Favoritos del usuario
  login/                   Inicio de sesión
  notifications/           Notificaciones internas
  onboarding/fanbases/     Selección inicial de fanbases
  profile/                 Perfil y agenda personal
  projects/                Conciertos y fanprojects
  votaciones/              Votaciones de fanprojects

components/
  fanbases/                Cards, publicaciones y controles de comunidad
  favorites/               Estado y botones de favoritos
  home/                    Buscadores de la página principal
  profile/                 Agenda, perfil e historial de participación
  projects/                Ideas y componentes de conciertos
  venues/                  Selector e información de recintos
  votes/                   Reacciones, comentarios y avisos de acceso

lib/
  comments/                Ideas, comentarios y respuestas
  email/                   Integración con Resend
  fanbases/                Datos y permisos de fanbases
  favorites/               Favoritos y agenda
  firebase/                Cliente, Admin SDK, sesión y Firestore
  google/                  Carga de Google Places
  notifications/           Notificaciones internas y por email
  projects/                Conciertos, fanprojects e imágenes
  users/                   Perfiles, roles, autorización y actividad
  votes/                   Votos y reacciones

public/items/               Imágenes locales del proyecto
```

## Funcionalidades por sección

### Página principal

La home presenta el concepto de Narabi y reúne accesos a conciertos, fanprojects, fanbases y votaciones. Incluye un buscador que relaciona conciertos y fanprojects con su artista, de modo que una búsqueda por nombre de grupo también encuentre contenido asociado aunque el título del evento sea diferente.

Los listados utilizan imágenes locales predeterminadas y componentes reutilizables. Las fanbases se muestran mediante una grilla con sus imágenes correspondientes y los conciertos utilizan una función centralizada para resolver su portada.

### Conciertos y fanprojects

Cada concierto tiene una página pública con su fecha, país, recinto y fanprojects relacionados. Dentro de un fanproject se muestran la descripción, los materiales necesarios y las instrucciones organizadas por sector.

La página del concierto incluye una sección para proponer ideas. Las ideas funcionan como una conversación: se pueden publicar comentarios, responder y reaccionar con votos positivos o negativos. Los fanprojects también poseen comentarios y respuestas propias.

### Votaciones

Las votaciones se agrupan por concierto y artista. Cada cuenta puede emitir un voto por concierto y cambiar su selección. La interfaz muestra el total de votos, las opciones disponibles, reacciones y comentarios.

Una persona sin sesión puede consultar las votaciones, pero al intentar votar, reaccionar o comentar recibe un aviso para iniciar sesión. Los usuarios comunes ven contenido relacionado con las fanbases que siguen. Los responsables de una fanbase pueden crear, editar, cerrar o eliminar las votaciones correspondientes a su propia comunidad. Los administradores generales pueden gestionar todas.

### Fanbases

La sección de fanbases permite buscar comunidades por nombre y entrar a su página de detalle. Cada fanbase muestra información general, cantidad de seguidores, integrantes, publicaciones y fanprojects vinculados.

Las publicaciones pueden incluir texto y videos embebidos mediante `iframe`. Los videos se reproducen desde la misma página y se muestran en filas individuales. La edición y eliminación de contenido se limita a propietarios, integrantes autorizados o administradores, según corresponda.

Un usuario normal puede seguir una fanbase o enviar una solicitud para colaborar. Desde el dashboard de la comunidad, el propietario puede aceptar o rechazar la solicitud y decidir si la persona recibirá permisos administrativos.

### Perfil y agenda

La página personal reúne los datos de la cuenta, la foto de perfil, la configuración de notificaciones y la agenda. El calendario se construye a partir de los fanprojects guardados y marca las fechas de los conciertos. También permite descargar un evento en formato `.ics` para incorporarlo a un calendario externo.

El perfil incluye un historial de eventos en los que la persona participó. Para construirlo se combinan votos, ideas, comentarios y respuestas guardados en Firestore, agrupándolos por concierto. Debajo se muestran los fanprojects favoritos y las fanbases seguidas.

### Dashboard

El dashboard cambia según el tipo de usuario:

- Un usuario con rol `user` no tiene acceso al dashboard.
- Un usuario con rol `fanbase` accede solamente a la información de las fanbases que administra. Puede consultar seguidores, integrantes, solicitudes, publicaciones, fanprojects y votaciones propias.
- Un usuario con rol `admin` puede ver y administrar la información global del sitio, incluidos usuarios, conciertos y comunidades.

## Autenticación y sesión

El inicio de sesión se realiza con Firebase Authentication mediante correo y contraseña o Google. Después de autenticar al usuario en el cliente, el ID token se envía a `/api/session/login`. El servidor lo intercambia por una cookie `__session` HTTP-only con una duración de cinco días.

Los Server Components y las Server Actions recuperan esa cookie con `getCurrentUser()` y la verifican mediante Firebase Admin SDK. Al cerrar sesión se elimina la cookie desde `/api/session/logout`.

Cuando una cuenta de tipo `user` inicia sesión por primera vez y todavía no sigue comunidades, se la dirige al onboarding de fanbases. Allí selecciona los grupos que quiere seguir. Esta preferencia se utiliza para personalizar las votaciones y reducir interacciones ajenas a las comunidades elegidas.

## Roles y permisos

Los perfiles se guardan en la colección `users` y utilizan el campo `user_type`.

```js
{
  email: "usuario@example.com",
  displayName: "Nombre visible",
  photoURL: "https://...",
  provider: "google.com",
  user_type: "user", // user | fanbase | admin
  fanbases: ["id-de-fanbase"],
  email_notifications: true,
  createdAt: "...",
  updatedAt: "..."
}
```

La propiedad `fanbases` vincula una cuenta de tipo `fanbase` con las comunidades que puede administrar. El rol `admin` no necesita esa relación porque posee acceso global.

## Modelo de datos en Firestore

La estructura principal utiliza las siguientes colecciones y subcolecciones:

```txt
users/{uid}
  favorites/{favoriteId}
  notifications/{notificationId}

fanbases/{fanbaseId}
  followers/{uid}
  members/{uid}
  membershipRequests/{uid}
  posts/{postId}

proyectos/{projectId}
  fanprojects/{fanprojectId}
    comments/{commentId}
      replies/{replyId}
  fanprojectVotes/{uid}
  votingReactions/{uid}
  votingComments/{commentId}
  ideas/{ideaId}
    replies/{replyId}
    reactions/{uid}
```

`proyectos` contiene los conciertos. Sus documentos guardan información como título, grupo, país, fecha, recinto e imagen. Los fanprojects son una subcolección porque pertenecen a un concierto específico. Los votos utilizan el UID como identificador del documento, lo que permite garantizar un único voto por persona y concierto.

## Sistema visual

La interfaz fue creada con Tailwind CSS y una paleta centrada en rosas y bordó:

- Bordó principal: `#823038`.
- Bordó oscuro: `#5C1F3A`.
- Rosa claro: `#FFE4F3`.
- Rosa de bordes: `#F2B8CF`.
- Fondo rosado: `#FFF7FB`.
- Fondo general: `#FDFDFF`.

Se utilizaron cards con bordes redondeados, grillas adaptables, sliders horizontales, estados hover e imágenes de concierto o fanbase. Los estilos responsivos permiten que las grillas se conviertan en una sola columna en pantallas pequeñas.

## Google Places para recintos

Al crear o editar un concierto, el campo de recinto utiliza Google Places para sugerir estadios y teatros mientras se escribe. Para habilitarlo se necesitan **Maps JavaScript API** y **Places API (New)**.

La clave debe ser una clave de navegador restringida por dominio y por API. En desarrollo se puede autorizar:

```txt
http://localhost:3000/*
```

En producción también debe agregarse el dominio desplegado. La aplicación conserva los nombres de recintos creados anteriormente aunque Google Places no esté configurado.

## Variables de entorno

Crear un archivo `.env` a partir de `.env.example` y completar los valores sin subir credenciales al repositorio.

```bash
# Firebase Web App
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=

# Google Places
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Imágenes
FIREBASE_STORAGE=false

# Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Notificaciones por email (opcional)
RESEND_API_KEY=
RESEND_FROM_EMAIL="Narabi <novedades@tu-dominio.com>"
APP_URL=http://localhost:3000
```

Las variables que comienzan con `NEXT_PUBLIC_` se incluyen en el cliente. `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` y `RESEND_API_KEY` son secretos de servidor y nunca deben exponerse en componentes del navegador.

## Configuración de Firebase

1. Crear un proyecto en Firebase Console.
2. Registrar una aplicación web y copiar sus credenciales públicas.
3. Habilitar Authentication con Email/Password y Google.
4. Crear la base de datos Cloud Firestore.
5. Generar una cuenta de servicio desde la configuración del proyecto.
6. Copiar los valores de la cuenta de servicio a las variables privadas del `.env`.
7. Crear manualmente el primer administrador cambiando `user_type` a `admin` en su documento de `users`.
8. Si se necesita una cuenta propietaria, usar `user_type: "fanbase"` y agregar los IDs autorizados dentro de `fanbases`.

Las imágenes se sirven desde `public/items` de manera predeterminada. Cloud Storage es opcional y se activa configurando `FIREBASE_STORAGE=true` junto con el bucket correspondiente.

## Instalación y ejecución

Requisitos:

- Node.js compatible con Next.js 16.
- npm.
- Un proyecto Firebase configurado.

Instalar dependencias:

```bash
npm install
```

Iniciar el entorno de desarrollo:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run lint     # Análisis estático con ESLint
npm run build    # Compilación optimizada de producción
npm run start    # Ejecutar la compilación de producción
```

Antes de subir cambios se recomienda ejecutar:

```bash
npm run lint
npm run build
```

## Decisiones importantes

Las imágenes locales fueron elegidas como opción predeterminada para evitar que el desarrollo dependa de Cloud Storage y de un plan de facturación. Google Places quedó como integración opcional porque requiere una clave restringida y facturación habilitada en Google Cloud. Las notificaciones internas funcionan sin Resend; el correo se envía solamente cuando las variables del servicio están configuradas.

El modelo de permisos se resuelve siempre en el servidor. La personalización por fanbases seguidas se aplica al recuperar las votaciones, y la administración de una comunidad se valida comparando el UID y los IDs asociados al perfil. Estas decisiones permiten que el diseño de la interfaz acompañe a la seguridad, pero no sea la única barrera de acceso.

## Estado del proyecto

Narabi incluye actualmente autenticación, perfiles, onboarding, conciertos, fanprojects, fanbases, publicaciones, videos embebidos, votaciones, comentarios, respuestas, reacciones, favoritos, agenda, historial de participación, notificaciones y dashboards diferenciados por rol.

El proyecto continúa siendo extensible: se pueden incorporar moderación avanzada, carga directa de imágenes, paginación, pruebas automatizadas, métricas de uso y reglas de seguridad adicionales para un entorno productivo de mayor escala.
