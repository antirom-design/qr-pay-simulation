// Seite „Methode“: Fahrplan-Zeitleiste zeichnen und Explore-Briefing kopieren
(function(){
  // Fahrplan im Stil der API-Seite
  var g=document.getElementById('tl'), NS='http://www.w3.org/2000/svg';
  var x0=190, w=(1000-x0-10)/13;
  function el(n,a,t){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);if(t)e.textContent=t;g.appendChild(e);return e;}
  for(var m=0;m<=13;m++){el('line',{x1:x0+m*w,y1:24,x2:x0+m*w,y2:200,'class':'tl-grid'}); if(m<13) el('text',{x:x0+m*w+w/2,y:16,'text-anchor':'middle','class':'tl-m'},'M'+(m+1));}
  var rows=[['Vergabe Zahlungsdienstleister',0,9,true],['Team, Netz, Schlüssel',0,3],['Bau',2,10],['Sicherheit, Datenschutz',1,11],['Pilot und erste Welle',10,13]];
  rows.forEach(function(r,i){var y=40+i*26; el('text',{x:0,y:y+13,'class':'tl-rl'+(r[3]?' b':'')},r[0]); el('rect',{x:x0+r[1]*w+2,y:y+2,width:(r[2]-r[1])*w-4,height:16,rx:3,'class':'tl-bar'+(r[3]?' v':'')});});
  var ms=[[1,'Auftrag'],[5,'Technik trägt'],[9,'Vertrag'],[11,'Pilot'],[13,'Erste Welle']];
  el('line',{x1:x0,y1:178,x2:1000-10,y2:178,'class':'tl-axis'});
  ms.forEach(function(p){var x=x0+p[0]*w; el('line',{x1:x,y1:24,x2:x,y2:178,'class':'tl-ms'}); el('path',{d:'M'+x+' 172 l6 6 -6 6 -6 -6z','class':'tl-dia'}); el('text',{x:p[0]===13?x:x,y:200,'text-anchor':p[0]===13?'end':'middle','class':'tl-gl'},p[1]);});

  var btn=document.getElementById('copyBtn'), pre=document.getElementById('promptText'), st=document.getElementById('copyStatus');
  function sel(){var r=document.createRange();r.selectNodeContents(pre);var s=window.getSelection();s.removeAllRanges();s.addRange(r);st.textContent='Text ist markiert, mit Strg+C oder Cmd+C kopieren.';}
  btn.addEventListener('click',function(){
    try{navigator.clipboard.writeText(pre.textContent).then(function(){st.textContent='Kopiert.';},sel);}catch(e){sel();}
  });
})();
