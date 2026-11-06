import {inSector} from './data.js';

// A half-degree front alignment tolerance matches the integer angle readout.
// It is a teaching aid, not an extension of the nominal 112.5-degree sectors.
export function lightVisible(light, camera) {
  const angle = (Math.atan2(camera.x-light.originX, camera.z-light.originZ)*180/Math.PI+360)%360;
  const forward = Math.min(angle,360-angle);
  if (light.width===112.5 && (light.color==='red'||light.color==='green') && forward<=0.5) return true;
  return inSector(angle,light.center,light.width);
}

export function aimCamera(camera, orbit, angle, elevation, distance) {
  const damping=orbit.enableDamping, auto=orbit.autoRotate;
  // Drain pending drag inertia before placing the camera, using the public API.
  orbit.enableDamping=false;
  orbit.autoRotate=false;
  orbit.update();
  const a=angle*Math.PI/180,e=elevation*Math.PI/180;
  camera.position.set(orbit.target.x+distance*Math.sin(a)*Math.cos(e),orbit.target.y+distance*Math.sin(e),orbit.target.z+distance*Math.cos(a)*Math.cos(e));
  orbit.update();
  orbit.enableDamping=damping;
  orbit.autoRotate=auto;
}
