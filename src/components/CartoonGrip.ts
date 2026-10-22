import * as THREE from 'three';

// One flat, continuous cartoon-hand silhouette, with no assembled volumes.
export function createCartoonGripGeometry() {
  const shape=new THREE.Shape();
  shape.moveTo(.043,-.085);
  shape.lineTo(.090,-.085);
  shape.bezierCurveTo(.103,-.058,.111,-.025,.110,.025);
  shape.bezierCurveTo(.110,.067,.096,.086,.072,.086);
  shape.bezierCurveTo(.050,.086,.037,.071,.037,.050);
  shape.lineTo(.037,.025);
  // A short thumb belongs to the same outline as the palm.
  shape.bezierCurveTo(.020,.036,.004,.035,.001,.021);
  shape.bezierCurveTo(-.002,.006,.018,-.006,.029,-.020);
  shape.bezierCurveTo(.042,-.039,.041,-.062,.043,-.085);
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{
    depth:.032,bevelEnabled:true,bevelSize:.007,bevelThickness:.005,
    bevelSegments:3,curveSegments:18,steps:1,
  });
  geometry.translate(0,0,-.008);
  geometry.computeVertexNormals();geometry.computeBoundingSphere();
  return geometry;
}
