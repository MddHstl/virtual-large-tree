<template>
    <div>
        
        <h2> Hello its tree </h2>
        

        <div class="bg-red-200 w-full overflow-hidden" style="height: 500px">
        
            <div id="zoomIt" class="bg-green-200">
                <RecycleScroller
                    class="scroller"
                    :items="data"
                    :item-size="32"
                    key-field="id"
                    v-slot="{ item }"
                >
                    <div class="hover:bg-green-900 cursor-pointer h-8 leading-8">
                        {{ item.label }}
                        <button>
                            Add next 10 +
                        </button>
                        <button>
                            Delete next 10 -
                        </button>
                    </div>
                </RecycleScroller>
            </div>
        </div>
        
    </div>
</template>

<script setup>
import { RecycleScroller } from 'vue-virtual-scroller';
import { onMounted, ref } from 'vue';
import panzoom from 'panzoom';
// import panZoom from 'vue-panzoom';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';

const element = ref(null);

const data = [];

for(let i = 0; i <= 1 * 1000 * 1000; i++){
    data.push(
        {
            id: i,
            label: 'Item + ' + i,
            size: 32,
        }
    )
}

onMounted(()=>{


    panzoom( document.querySelector('#zoomIt'),
        {
            maxZoom: 3,
            minZoom: 0.5,
            beforeWheel: function(e) {
                // allow wheel-zoom only if altKey is down. Otherwise - ignore
                var shouldIgnore = !e.altKey;
                return shouldIgnore;
            }
        }
    );
});


</script>

<style scoped lang="scss">
.scroller {
  height: 1000px;
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