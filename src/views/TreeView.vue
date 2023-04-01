<template>
    <div class="fixed top-0 left-0 right-0 text-center">
        
        <h2> Its large tree with {{ nodes }} nodes, and {{ visibleNodes }} visible nodes</h2>
        <div ref="element"></div>
        
    </div>
</template>

<script setup>
import { onMounted, ref, reactive } from 'vue';
import { renderTwoJsTree } from '@/helpers/tree-generator.js';
import { useRoute } from 'vue-router';
import jsonStructure from '@/assets/json-structure.json';

const element = ref(null);
const scroller = ref(null);

const route = useRoute();

const rows = +route.query?.rows || 45;

const nodes = ref(0);
const visibleNodes = ref(0);

const configTree = 
{
    lastChildCol: 3,
    nodeScopedWidth: 300,
    nodeWidth: 280,
    nodeHeigth: 300,
    gap: 100,
}

/*
const treeStructure = 
{
    id: 1,
    name: 'Root very long',
    size: 300, // calculate
    childrens: [
        {
            id: 2,
            name: 'Root Child 1',
            size: 650, // calculate
            childrens: [
                {
                    id: 5,
                    name: 'Root Child 1.1',
                    size: 300, // calculate
                    childrens: [],
                },
                {
                    id: 5,
                    name: 'Root Child 1.2',
                    size: 300, // calculate
                    childrens: [],
                }
            ]

        },
        {
            id: 3,
            name: 'Root Child 2 with very very long text here',
            size: 300, // calculate
            childrens: [
                {
                    id: 6,
                    name: 'Child 2.1',
                    size: 300, // calculate
                    childrens: [
                        {
                            id: 7,
                            name: 'Child 2.1.1',
                            size: 300, // calculate
                            childrens: [],
                        },
                        {
                            id: 7,
                            name: 'Child 2.1.2',
                            size: 300, // calculate
                            childrens: [],
                        },
                    ],
                },
            ]

        },
        {
            id: 4,
            name: 'Root Child 3',
            size: 300, // calculate
            childrens: [
                {
                    id: 6,
                    name: 'Child 3.1',
                    size: 300, // calculate
                    childrens: [
                        {
                            id: 7,
                            name: 'Child 3.1.1',
                            size: 300, // calculate
                            childrens: [],
                        },
                        {
                            id: 7,
                            name: 'Child 3.1.2',
                            size: 300, // calculate
                            childrens: [],
                        },
                    ],
                },
                {
                    id: 7,
                    name: 'Child 3.2',
                    size: 300, // calculate
                    childrens: [],
                },
                {
                    id: 8,
                    name: 'Child 3.3',
                    size: 300, // calculate
                    childrens: [
                        {
                            id: 9,
                            name: 'Child 3.3.1',
                            size: 300, // calculate
                            childrens: [],
                        },
                        {
                            id: 10,
                            name: 'Child 3.3.2',
                            size: 300, // calculate
                            childrens: [],
                        },
                    ],
                }
            ]

        },
    ]
};
*/

const treeStructure = jsonStructure;
const lastNodes = [];


onMounted(() =>{
    
    updateNodeStructure( treeStructure, null, 1 ); // Modify treeStructure
    scopeCalculation(); // Modify treeStructure
    leftShiftCalculation(); // Modify treeStructure

    renderTwoJsTree(
        element.value, 
        route.query.type, 
        treeStructure,
        configTree,
        { nodes, visibleNodes }
    );

});


    function updateNodeStructure( node, parent, lvl ){

        node.row = lvl;
        node.parent = parent;
        node.scopedWidth = 0;
        nodes.value++; // [TODO] Optimize

        const nextLvl = lvl + 1;

        if(node.childrens == null || node.childrens.length === 0 ) { 
            node.scopedWidth = configTree.nodeScopedWidth;
            lastNodes.push(node);
            return;
        }
        
        for( let i = 0; i < node.childrens.length; i++ ) {
            updateNodeStructure(node.childrens[i], node, nextLvl);
        }
    };



    function scopeCalculation(){

        for( let i = 0; i < lastNodes.length; i++ ) {
            lastNodes[i].scopedWidth = configTree.nodeScopedWidth; 
            addScopedUp(lastNodes[i], configTree.nodeScopedWidth, true );
        };

        function addScopedUp( node, size, isLastNode = false ) {
            if (node.parent === null) return;
            
            node.isLastNode = isLastNode;

            if(isLastNode && node.parent.scopedWidth >= configTree.nodeScopedWidth * configTree.lastChildCol){
                // additional logic
            }else{
                node.parent.scopedWidth += size;
                addScopedUp(node.parent, size);
            }
                
        }
    }

    function leftShiftCalculation(){

        shiftPoints( treeStructure, 0 );

        function shiftPoints( node, leftShift ){
            node.leftShift = leftShift;

            if(node.childrens != null)
                for(let i = 0; i < node.childrens.length; i++){

                    if(i > 0) leftShift += node.childrens[i - 1].scopedWidth
                    shiftPoints(node.childrens[i], leftShift);
                }

        }
        
    }


</script>

<style scoped lang="scss">
.scroller {
  height: 8000px;
  width: 100%;
  /* overflow-y: hidden; */
}

.item {
  height: 32%;
  padding: 0 12px;
  display: flex;
  align-items: center;

  &:hover{
    background-color: red;
  }
}
</style>