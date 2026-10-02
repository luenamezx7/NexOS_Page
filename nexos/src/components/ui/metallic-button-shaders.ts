// Shader supplied for MetallicButton; pink/violet tint replaces the silver finish.
export const VERTEX_SHADER = `#version 300 es
precision mediump float;
layout(location = 0) in vec4 a_position;
uniform vec2 u_resolution;
uniform float u_pixelRatio, u_originX, u_originY, u_worldWidth, u_worldHeight;
uniform float u_fit, u_scale, u_rotation, u_offsetX, u_offsetY;
out vec2 v_objectUV;
out vec2 v_responsiveUV;
out vec2 v_responsiveBoxGivenSize;
vec3 getBoxSize(float boxRatio, vec2 givenBoxSize) {
  vec2 box=vec2(0.);
  box.x=boxRatio*min(givenBoxSize.x/boxRatio,givenBoxSize.y);
  float noFitBoxWidth=box.x;
  if(u_fit==1.) box.x=boxRatio*min(u_resolution.x/boxRatio,u_resolution.y);
  else if(u_fit==2.) box.x=boxRatio*max(u_resolution.x/boxRatio,u_resolution.y);
  box.y=box.x/boxRatio;
  return vec3(box,noFitBoxWidth);
}
void main(){
  gl_Position=a_position;
  vec2 uv=gl_Position.xy*.5;
  vec2 boxOrigin=vec2(.5-u_originX,u_originY-.5);
  vec2 givenBoxSize=max(vec2(u_worldWidth,u_worldHeight),vec2(1.))*u_pixelRatio;
  float r=u_rotation*3.14159265358979323846/180.;
  mat2 graphicRotation=mat2(cos(r),sin(r),-sin(r),cos(r));
  vec2 graphicOffset=vec2(-u_offsetX,u_offsetY);
  vec2 fixedRatioBoxGivenSize=vec2(u_worldWidth==0.?u_resolution.x:givenBoxSize.x,u_worldHeight==0.?u_resolution.y:givenBoxSize.y);
  vec2 objectBoxSize=getBoxSize(1.,fixedRatioBoxGivenSize).xy;
  vec2 objectWorldScale=u_resolution.xy/objectBoxSize;
  v_objectUV=graphicRotation*((uv*objectWorldScale+boxOrigin*(objectWorldScale-1.)+graphicOffset)/u_scale);
  v_responsiveBoxGivenSize=fixedRatioBoxGivenSize;
  float responsiveRatio=v_responsiveBoxGivenSize.x/v_responsiveBoxGivenSize.y;
  vec2 responsiveBoxSize=getBoxSize(responsiveRatio,v_responsiveBoxGivenSize).xy;
  vec2 responsiveBoxScale=u_resolution.xy/responsiveBoxSize;
  v_responsiveUV=(uv*responsiveBoxScale+boxOrigin*(responsiveBoxScale-1.)+graphicOffset)/u_scale;
  v_responsiveUV.x*=responsiveRatio;
  v_responsiveUV=graphicRotation*v_responsiveUV;
  v_responsiveUV.x/=responsiveRatio;
}`;

export const FRAGMENT_SHADER = `#version 300 es
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec4 u_colorBack, u_colorTint;
uniform float u_softness, u_repetition, u_shiftRed, u_shiftBlue, u_distortion, u_contour, u_angle;
in vec2 v_objectUV;
in vec2 v_responsiveUV;
in vec2 v_responsiveBoxGivenSize;
out vec4 fragColor;
#define PI 3.14159265358979323846
vec2 rotate(vec2 uv,float th){return mat2(cos(th),sin(th),-sin(th),cos(th))*uv;}
vec3 permute(vec3 x){return mod(((x*34.0)+1.0)*x,289.0);}
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));
  vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=x0.x>x0.y?vec2(1.,0.):vec2(0.,1.);
  vec4 x12=x0.xyxy+C.xxzz;
  x12.xy-=i1;
  i=mod(i,289.);
  vec3 p=permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
  m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.;
  vec3 h=abs(x)-.5;
  vec3 ox=floor(x+.5);
  vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g;
  g.x=a0.x*x0.x+h.x*x0.y;
  g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.*dot(m,g);
}
float getColorChanges(float c1,float c2,float stripe_p,vec3 w,float blur,float bump,float tint){
  float ch=mix(c2,c1,smoothstep(0.,2.*blur,stripe_p));
  float border=w[0];
  ch=mix(ch,c2,smoothstep(border,border+2.*blur,stripe_p));
  border=w[0]+.4*(1.-bump)*w[1];
  ch=mix(ch,c1,smoothstep(border,border+2.*blur,stripe_p));
  border=w[0]+.5*(1.-bump)*w[1];
  ch=mix(ch,c2,smoothstep(border,border+2.*blur,stripe_p));
  border=w[0]+w[1];
  ch=mix(ch,c1,smoothstep(border,border+2.*blur,stripe_p));
  float gradient_t=(stripe_p-w[0]-w[1])/w[2];
  float gradient=mix(c1,c2,smoothstep(0.,1.,gradient_t));
  ch=mix(ch,gradient,smoothstep(border,border+.5*blur,stripe_p));
  return mix(ch,1.-min(1.,(1.-ch)/max(tint,.0001)),u_colorTint.a);
}
void main(){
  float t=.3*(u_time+2.8);
  vec2 uv=v_objectUV+.5; uv.y=1.-uv.y;
  float cycleWidth=u_repetition;
  vec2 rotatedUV=uv-vec2(.5);
  float angle=(-u_angle+70.)*PI/180.;
  rotatedUV=vec2(rotatedUV.x*cos(angle)-rotatedUV.y*sin(angle),rotatedUV.x*sin(angle)+rotatedUV.y*cos(angle))+vec2(.5);
  vec2 shapeUV=(uv-.5)*.67;
  float edge=pow(clamp(3.*length(shapeUV),0.,1.),18.);
  edge=mix(smoothstep(.9-2.*fwidth(edge),.9,edge),edge,smoothstep(0.,.4,u_contour));
  float opacity=1.-smoothstep(.9-2.*fwidth(edge),.9,edge);
  edge=1.2*edge;
  float diagBLtoTR=rotatedUV.x-rotatedUV.y;
  float diagTLtoBR=rotatedUV.x+rotatedUV.y;
  vec3 color1=vec3(.98,.98,1.);
  vec3 color2=vec3(.1,.1,.1+.1*smoothstep(.7,1.3,diagTLtoBR));
  vec2 grad_uv=uv-.5;
  float dist=length(grad_uv+vec2(0.,.2*diagBLtoTR));
  grad_uv=rotate(grad_uv,(.25-.2*diagBLtoTR)*PI);
  float direction=grad_uv.x;
  float bump=(1.-pow(1.8*dist,1.2))*pow(uv.y,.3);
  float thin_strip_1_ratio=.12/cycleWidth*(1.-.4*bump);
  float thin_strip_2_ratio=.07/cycleWidth*(1.+.4*bump);
  float wide_strip_ratio=1.-thin_strip_1_ratio-thin_strip_2_ratio;
  float thin_strip_1_width=cycleWidth*thin_strip_1_ratio;
  float thin_strip_2_width=cycleWidth*thin_strip_2_ratio;
  float noise=snoise(uv-t);
  edge+=(1.-edge)*u_distortion*noise;
  direction+=diagBLtoTR;
  direction-=2.*noise*diagBLtoTR*(smoothstep(0.,1.,edge)*(1.-smoothstep(0.,1.,edge)));
  direction*=mix(1.,1.-edge,smoothstep(.5,1.,u_contour));
  direction-=1.7*edge*smoothstep(.5,1.,u_contour);
  direction+=.2*pow(u_contour,4.)*(1.-smoothstep(0.,1.,edge));
  bump*=clamp(pow(uv.y,.1),.3,1.);
  direction*=(.1+(1.1-edge)*bump);
  direction*=(.4+.6*(1.-smoothstep(.5,1.,edge)));
  direction+=.18*(smoothstep(.1,.2,uv.y)*(1.-smoothstep(.2,.4,uv.y)));
  direction+=.03*(smoothstep(.1,.2,1.-uv.y)*(1.-smoothstep(.2,.4,1.-uv.y)));
  direction*=(.5+.5*pow(uv.y,2.));
  direction=direction*cycleWidth-t;
  float colorDispersion=clamp(1.-bump,0.,1.);
  float dispersionRed=colorDispersion+.03*bump*noise;
  dispersionRed+=5.*(smoothstep(-.1,.2,uv.y)*(1.-smoothstep(.1,.5,uv.y)))*(smoothstep(.4,.6,bump)*(1.-smoothstep(.4,1.,bump)));
  dispersionRed-=diagBLtoTR;
  float dispersionBlue=colorDispersion*1.3;
  dispersionBlue+=(smoothstep(0.,.4,uv.y)*(1.-smoothstep(.1,.8,uv.y)))*(smoothstep(.4,.6,bump)*(1.-smoothstep(.4,.8,bump)));
  dispersionBlue-=.2*edge;
  dispersionRed*=u_shiftRed/20.; dispersionBlue*=u_shiftBlue/20.;
  float blur=u_softness/15.;
  vec3 w=vec3(thin_strip_1_width,thin_strip_2_width,wide_strip_ratio);
  w[1]-=.02*smoothstep(0.,1.,edge+bump);
  float stripe_r=fract(direction+dispersionRed);
  float stripe_g=fract(direction);
  float stripe_b=fract(direction-dispersionBlue);
  float r=getColorChanges(color1.r,color2.r,stripe_r,w,blur+fwidth(stripe_r),bump,u_colorTint.r);
  float g=getColorChanges(color1.g,color2.g,stripe_g,w,blur+fwidth(stripe_g),bump,u_colorTint.g);
  float b=getColorChanges(color1.b,color2.b,stripe_b,w,blur+fwidth(stripe_b),bump,u_colorTint.b);
  vec3 color=vec3(r,g,b);
  // Keep the supplied reflections but color the metal with the NexOS palette.
  vec3 finish=mix(u_colorTint.rgb,vec3(.55,.18,.89),smoothstep(.25,.75,uv.x));
  float luminance=dot(color,vec3(.299,.587,.114));
  color=mix(finish*.38,finish,luminance);
  color=mix(color,vec3(1.,.79,.93),pow(luminance,8.)*.58);
  color*=opacity;
  vec3 bgColor=u_colorBack.rgb*u_colorBack.a;
  color+=bgColor*(1.-opacity);
  opacity+=u_colorBack.a*(1.-opacity);
  color+=1./256.*(fract(sin(dot(.014*gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453123)-.5);
  fragColor=vec4(color,opacity);
}`;
