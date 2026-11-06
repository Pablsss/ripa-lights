// Only distinguishable families are rivals. Optional/length variants stay in one family.
export const families=[
 {id:'motor',label:'Buque de propulsión mecánica',presets:['motor12','motor50','motorLarge','sailMotor'],why:'Luces de costado y luz o luces blancas de propulsión mecánica. Un velero que utiliza motor pertenece a esta categoría.'},
 {id:'sailing',label:'Buque a vela',presets:['sail','tricolor','sailRG'],why:'Costados y alcance, separados o combinados en un tricolor. Puede añadir roja sobre verde, pero no lleva tope de motor.'},
 {id:'trawling',label:'Pesquero de arrastre',presets:['trawl','trawlLarge'],why:'Verde sobre blanca, ambas todo horizonte. Con arrancada añade costados y alcance.'},
 {id:'fishing',label:'Pesquero que no es de arrastre',presets:['fish','fishGear'],why:'Roja sobre blanca, ambas todo horizonte. El aparejo a más de 150 m añade una blanca hacia el aparejo.'},
 {id:'nuc',label:'Buque sin gobierno',presets:['nuc'],why:'Dos rojas todo horizonte en vertical. Con arrancada añade costados y alcance, pero no tope.'},
 {id:'ram',label:'Buque con maniobra restringida',presets:['ram'],why:'Roja, blanca y roja en vertical. Con arrancada añade luces de navegación.'},
 {id:'dredging',label:'Buque dragando con obstrucción',presets:['dredge'],why:'Roja-blanca-roja central, dos rojas en la banda obstruida y dos verdes por donde se puede pasar.'},
 {id:'mine',label:'Dragaminas en operaciones',presets:['mine'],why:'Tres verdes todo horizonte: una alta central y una a cada extremo de la verga.'},
 {id:'draft',label:'Buque restringido por su calado',presets:['draft'],why:'Tres rojas todo horizonte en vertical, además de las luces de propulsión mecánica.'},
 {id:'pilot',label:'Embarcación de práctico en servicio',presets:['pilot'],why:'Blanca sobre roja, ambas todo horizonte. En navegación añade costados y alcance.'},
 {id:'anchored',label:'Buque fondeado',presets:['anchorLarge','anchor100'],why:'Dos blancas todo horizonte: la de proa más alta que la de popa. Sin luces de marcha. En el test se evita el caso de una sola blanca, que puede confundirse con una embarcación pequeña a motor.'},
 {id:'aground',label:'Buque varado',presets:['groundSmall','groundLarge'],why:'Dos rojas todo horizonte en vertical, además de las luces blancas de fondeo.'},
 {id:'towing',label:'Buque remolcando o empujando',presets:['towShort','towLong','push','alongside'],why:'Dos o tres luces de tope en vertical. Al remolcar por popa, también lleva una amarilla de remolque sobre el alcance.'},
 {id:'hover',label:'Aerodeslizador sin desplazamiento',presets:['hover'],why:'Amarilla centelleante todo horizonte, además de las luces de motor.'},
 {id:'wig',label:'Nave de vuelo rasante (WIG)',presets:['wig'],why:'Roja centelleante todo horizonte al despegar, aterrizar o volar cerca de la superficie, además de las luces de motor.'}
];
export function shuffled(items,rng=Math.random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeQuestions(rng=Math.random){return shuffled(families,rng).slice(0,10).map(f=>{const choices=shuffled([f,...shuffled(families.filter(x=>x.id!==f.id),rng).slice(0,3)],rng).map(x=>({id:x.id,label:x.label}));return {presetId:f.presets[Math.floor(rng()*f.presets.length)],situation:'making',bearing:[0,30,330][Math.floor(rng()*3)],choices,correct:choices.findIndex(x=>x.id===f.id),explanation:f.why};});}
