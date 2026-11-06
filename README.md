# RIPA · Luces y marcas 3D

[Abrir el simulador](https://pablsss.github.io/ripa-lights/) · [Ejercicio: velero visto por babor de noche](https://pablsss.github.io/ripa-lights/?vessel=sail&bearing=270&sky=50)

Simulador en español de luces y marcas de navegación. Explora 33 configuraciones de buques, cambia el ángulo de observación y practica el reconocimiento en el cuestionario.
    
Para explorar el visor, ejecuta `python3 -m http.server 4173 --bind 127.0.0.1 --directory web` y abre http://localhost:4173. Para usar también el cuestionario con historial, instala Node 22.13 o posterior y ejecuta `npm ci`, `npm run build` y `npm start`. El servidor local guarda tus intentos en SQLite.
    
Comprueba los sectores de visibilidad con `node qa-tests.mjs` y el cuestionario con `node qa-quiz.mjs` después de compilar. Three.js incluye su licencia en `web/vendor`.
