import Two from "two.js";
import { ZUI } from "two.js/extras/jsm/zui.js";
import { debounce } from 'lodash';

export function renderTwoJsTree( element, renderType, treeStructure, config, information ) {

  var type = Two.Types.canvas; // Default type
  if( renderType === 'svg' ) type = Two.Types.svg; 
  if( renderType === 'webgl' ) type = Two.Types.webgl; 

  var two = new Two({
    type,
    fullscreen: true,
    autostart: true
  }).appendTo(element);


  const defaultStyles = {
    weight: 400,
    fill: "black",
    length: 50,
    family: "Angus, Arial, sans-serif",
    alignment: "center",
    baseline: "baseline",
    size: 14,
    margin: {
      top: 20,
      left: 0,
      right: 0,
      bottom: 0
    }
  };
  
  var stage = new Two.Group();
  var visibleNodes = [];
  var sizeH = config.nodeHeigth;
  var sizeW = config.nodeWidth;
  var gap = config.gap;

    
    function calculateNodePosition( node ){

        
        if (node.isLastNode){
          node.addedRow = Math.ceil( ( (node.leftShift + node.scopedWidth) - node.parent.leftShift )  / (config.lastChildCol * config.nodeScopedWidth) ) - 1;
          node.row += node.addedRow;
          node.leftShift -= node.addedRow * config.lastChildCol * config.nodeScopedWidth;

        }
        var x = (two.width / 2) 
            - treeStructure.scopedWidth / 2 + node.leftShift + ( node.scopedWidth ) / 2

        var y = 80 + sizeH / 2 + (sizeH + gap) * (node.row - 1);
        

        var word = node.name;

        var group = new Two.Group();

        var shape = new Two.Rectangle(x, y, sizeW, sizeH);
        shape.visible = false;

        if (node.parent !== null && (node.addedRow == 0 || node.addedRow == null) ) {
          var arrow = new Two.Line( x, y - (sizeH / 2), (two.width / 2)  - treeStructure.scopedWidth / 2 + node.parent.leftShift + ( node.parent.scopedWidth ) / 2 , y - (sizeH / 2) - gap);
          arrow.visible = false;
        }

        {
          // [TODO] Optimize it
          const lettersPerRow = 35;
          const rowsHeigth = 20;
          const rows = (Math.ceil(word.length / lettersPerRow) > (sizeH / rowsHeigth - 2))?(sizeH / rowsHeigth - 2):Math.ceil(word.length / lettersPerRow);
          
          var texts = new Two.Group();

          for(var i = 0; i < rows; i++){
            texts.add(new Two.Text(word.substring(i * lettersPerRow, (i + 1) * lettersPerRow ), x, y - (sizeH / 2) + (i + 1.5) * rowsHeigth, defaultStyles));
          }
          
          texts.visible = false;
        }

        node.groupCanvas = group;
        node.textCanvas = texts;
        node.shapeCanvas = shape;
        node.arrowCanvas = arrow;
        
        shape.noStroke().fill = 
        "rgba(" +
            255 +
            "," +
            Math.floor(Math.random() * 255) +
            "," +
            Math.floor(Math.random() * 255) +
            "," +
            1 +
            ")";

        if (node.parent === null )
            group.add(shape, texts);   
        else
            group.add(shape, arrow, texts);

        stage.add(group);

        
        if(node.childrens != null)
          for( var i = 0; i < node.childrens.length; i++ ) {
              calculateNodePosition(node.childrens[i]);
          }
    
    };

    calculateNodePosition( treeStructure );

  two.add(stage);
  var zui = addZUI();

  rerenderVisible(zui);
  
  function addZUI() {
  
      var domElement = two.renderer.domElement;
      var zui = new ZUI(stage); 
      var mouse = new Two.Vector();
      var touches = {};
      var distance = 0;
      var selectedNode = null;

  
      zui.addLimits(0.01, 8);
  
      domElement.addEventListener('mousedown', mousedown, false);

      domElement.addEventListener('mousewheel', mousewheel, false);
      domElement.addEventListener('wheel', mousewheel, false);
  
      domElement.addEventListener('touchstart', touchstart, false);
      domElement.addEventListener('touchmove', touchmove, false);
      domElement.addEventListener('touchend', touchend, false);
      domElement.addEventListener('touchcancel', touchend, false);
  
      function mousedown(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        // console.log("mousedown");
        // console.log([e.clientX, e.clientY]);
        // console.log(zui);
        // console.log(treeStructure.shapeCanvas.getBoundingClientRect());

        selectedNode = visibleNodes.find( (item) => { 
          var rect = item.shapeCanvas.getBoundingClientRect();
          var dragging = mouse.x > rect.left && mouse.x < rect.right
            && mouse.y > rect.top && mouse.y < rect.bottom;
            return dragging;
        } );

        console.log("selectedNode");
        console.log(selectedNode);

        if(selectedNode){
          selectedNode.shapeCanvas.stroke = "#000";
          selectedNode.shapeCanvas.opacity = 0.25;
          // Group this
          selectedNode.oldX = selectedNode.shapeCanvas.position.x
          selectedNode.oldY = selectedNode.shapeCanvas.position.y
          selectedNode.oldTextX = selectedNode.textCanvas.position.x
          selectedNode.oldTextY = selectedNode.textCanvas.position.y
        }

        window.addEventListener('mousemove', mousemove, false);
        window.addEventListener('mouseup', mouseup, false);
      }
  
      function mousemove(e) {
        var dx = e.clientX - mouse.x;
        var dy = e.clientY - mouse.y;
        if (selectedNode) {
          selectedNode.shapeCanvas.position.x += dx / zui.scale;
          selectedNode.shapeCanvas.position.y += dy / zui.scale;

          selectedNode.textCanvas.position.x += dx / zui.scale;
          selectedNode.textCanvas.position.y += dy / zui.scale;

        } else {
          zui.translateSurface(dx, dy);
          visibleNodes = debouncedRenderVisible(zui);
        }
      
        mouse.set(e.clientX, e.clientY);
      }
  
      function mouseup(e) {
       
        if(selectedNode){
          // [TODO] Only visual, arrows stay old !!!
          mouse.x = e.clientX;
          mouse.y = e.clientY;

          var dropNode = visibleNodes.find( (item) => { 
            if(item === selectedNode) return false;
            var rect = item.shapeCanvas.getBoundingClientRect();
            var dragging = mouse.x > rect.left && mouse.x < rect.right
              && mouse.y > rect.top && mouse.y < rect.bottom;
              return dragging;
          } );

          if(dropNode){
            console.log("Good transfer");

            var distanceX = dropNode.shapeCanvas.position.x - selectedNode.shapeCanvas.position.x;
            var distanceY = dropNode.shapeCanvas.position.y - selectedNode.shapeCanvas.position.y;

            selectedNode.shapeCanvas.position.x += distanceX;
            selectedNode.shapeCanvas.position.y += distanceY;
            selectedNode.textCanvas.position.x += distanceX;
            selectedNode.textCanvas.position.y += distanceY;

            distanceX = selectedNode.oldX - dropNode.shapeCanvas.position.x;
            distanceY = selectedNode.oldY - dropNode.shapeCanvas.position.y;

            dropNode.shapeCanvas.position.x += distanceX;
            dropNode.shapeCanvas.position.y += distanceY;
            dropNode.textCanvas.position.x += distanceX;
            dropNode.textCanvas.position.y += distanceY;

            selectedNode.shapeCanvas.noStroke();
            selectedNode.shapeCanvas.opacity = 1;

          }else{
              console.log("Bad transfer");
              selectedNode.shapeCanvas.position.x = selectedNode.oldX;
              selectedNode.shapeCanvas.position.y = selectedNode.oldY;
    
              selectedNode.textCanvas.position.x = selectedNode.oldTextX;
              selectedNode.textCanvas.position.y = selectedNode.oldTextY;
            }
          }


        window.removeEventListener('mousemove', mousemove, false);
        window.removeEventListener('mouseup', mouseup, false);
      }

      function mousewheel(e) {
        var dy = (e.wheelDeltaY || - e.deltaY) / 1000;
        
        visibleNodes = debouncedRenderVisible(zui);
        zui.zoomBy(dy, e.clientX, e.clientY);
      }
  
      function touchstart(e) {
        switch (e.touches.length) {
          case 2:
            pinchstart(e);
            break;
          case 1:
            panstart(e)
            break;
        }
      }
  
      function touchmove(e) {
        switch (e.touches.length) {
          case 2:
            pinchmove(e);
            break;
          case 1:
            panmove(e)
            break;
        }
      }
  
      function touchend(e) {
        touches = {};
        var touch = e.touches[ 0 ];
        if (touch) {  // Pass through for panning after pinching
          mouse.x = touch.clientX;
          mouse.y = touch.clientY;
        }
      }
  
      function panstart(e) {
        var touch = e.touches[ 0 ];
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
      }
  
      function panmove(e) {
        var touch = e.touches[ 0 ];
        var dx = touch.clientX - mouse.x;
        var dy = touch.clientY - mouse.y;
        zui.translateSurface(dx, dy);
        mouse.set(touch.clientX, touch.clientY);
      }
  
      function pinchstart(e) {
        for (var i = 0; i < e.touches.length; i++) {
          var touch = e.touches[ i ];
          touches[ touch.identifier ] = touch;
        }
        var a = touches[ 0 ];
        var b = touches[ 1 ];
        var dx = b.clientX - a.clientX;
        var dy = b.clientY - a.clientY;
        distance = Math.sqrt(dx * dx + dy * dy);
        mouse.x = dx / 2 + a.clientX;
        mouse.y = dy / 2 + a.clientY;
      }
  
      function pinchmove(e) {
        for (var i = 0; i < e.touches.length; i++) {
          var touch = e.touches[ i ];
          touches[ touch.identifier ] = touch;
        }
        var a = touches[ 0 ];
        var b = touches[ 1 ];
        var dx = b.clientX - a.clientX;
        var dy = b.clientY - a.clientY;
        var d = Math.sqrt(dx * dx + dy * dy);
        var delta = d - distance;
        zui.zoomBy(delta / 250, mouse.x, mouse.y);
        distance = d;
      }
      return zui;
  }


  const debouncedRenderVisible = debounce((zui) => rerenderVisible(zui), 100);

  function rerenderVisible( zui ){
    console.log("Rerender");
    console.log([zui.scale, zui.surfaceMatrix.elements[2], zui.surfaceMatrix.elements[5] ]);
    console.log([0, two.width, 0, two.height]);

    var visibleNodesTemp = [];
    var width = two.width;
    var height = two.height;
    
    var VisibleBlock = {
      y:{
        from: (0 - zui.surfaceMatrix.elements[5]) / zui.scale - 1000,
        to: (height - zui.surfaceMatrix.elements[5]) / zui.scale + 1000
      },
      x:{
        from: (0 - zui.surfaceMatrix.elements[2]) / zui.scale - 1000,
        to: (width - zui.surfaceMatrix.elements[2]) / zui.scale + 1000
      }
    };

    console.log(VisibleBlock);

    function _checkElems( node ) {
      
      if(
        node.shapeCanvas.position.x > VisibleBlock.x.from 
        && node.shapeCanvas.position.x < VisibleBlock.x.to 
        && node.shapeCanvas.position.y > VisibleBlock.y.from 
        && node.shapeCanvas.position.y < VisibleBlock.y.to 

        && zui.scale > 0.1
        )
        node.textCanvas.visible = true;
      else
        node.textCanvas.visible = false;



      if(
        node.shapeCanvas.position.x > VisibleBlock.x.from 
        && node.shapeCanvas.position.x < VisibleBlock.x.to
        && node.shapeCanvas.position.y > VisibleBlock.y.from 
        && node.shapeCanvas.position.y < VisibleBlock.y.to 
        ){
          visibleNodesTemp.push(node);
          node.shapeCanvas.visible = true;
        }
      else
        node.shapeCanvas.visible = false;
      
    if (node.arrowCanvas){
      var arrowX1 = node.arrowCanvas.vertices[0].x;
      var arrowY1 = node.arrowCanvas.vertices[0].y;
      var arrowX2 = node.arrowCanvas.vertices[1].x;
      var arrowY2 = node.arrowCanvas.vertices[1].y;


      // var circle1 = new Two.Circle(arrowX1, arrowY1, 10);
      // var circle2 = new Two.Circle(arrowX2, arrowY2, 10);
      // stage.add(circle1, circle2);
      
      var firstDiagonalX1 = VisibleBlock.x.from;
      var firstDiagonalY1 = VisibleBlock.y.from;
      var firstDiagonalX2 = VisibleBlock.x.to;
      var firstDiagonalY2 = VisibleBlock.y.to;

      var secondDiagonalX1 = VisibleBlock.x.from;
      var secondDiagonalY1 = VisibleBlock.y.to;
      var secondDiagonalX2 = VisibleBlock.x.to;
      var secondDiagonalY2 = VisibleBlock.y.from;


      // var firstDiagonal = new Two.Line( firstDiagonalX1, firstDiagonalY1, firstDiagonalX2, firstDiagonalY2);
      // var secondDiagonal = new Two.Line( secondDiagonalX1, secondDiagonalY1, secondDiagonalX2, secondDiagonalY2);

      if(
        zui.scale > 0.1 
        && (
        (VisibleBlock.x.from < arrowX1 
        && VisibleBlock.x.to > arrowX1
        && VisibleBlock.y.from < arrowY1
        && VisibleBlock.y.to > arrowY1)
        ||
        (VisibleBlock.x.from < arrowX2 
        && VisibleBlock.x.to > arrowX2
        && VisibleBlock.y.from < arrowY2
        && VisibleBlock.y.to > arrowY2)
        )
      ){
        node.arrowCanvas.visible = true;
      }else{
        node.arrowCanvas.visible = false;
      }


      // stage.add(firstDiagonal, secondDiagonal);
    }
      
      if(node.childrens != null)
        for( var i = 0; i < node.childrens.length; i++ ) {
          _checkElems(node.childrens[i]);
        }
    }


    _checkElems( treeStructure );

    visibleNodes = visibleNodesTemp;
    information.visibleNodes.value = visibleNodesTemp.length;

  }

}