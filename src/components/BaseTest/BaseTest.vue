<!--
 * @Author: 九璃怀特 1599130621@qq.com
 * @Date: 2023-04-18 16:05:31
 * @LastEditors: 九璃怀特 1599130621@qq.com
 * @LastEditTime: 2023-04-19 16:37:32
 * @FilePath: \zxi-surface\src\components\BaseTest\BaseTest.vue
 * @Description: 
 -->

 <script setup lang='ts'>
 import BaseIconButton from "cp/BaseIconButton/BaseIconButton.vue";

 function haha(){
  
 }
 </script>
 
 <template>
   <!-- <div>
     <div class="container" @click="cleanCache">
       <ZXIButton class="button">
         <i class="iconfont icon--huancunguanli"></i>
       </ZXIButton>
     </div>
   </div> -->
   <BaseIconButton :icon="'icon-caidanguanli'" :text="'text'" @click="haha"></BaseIconButton>
 </template>
 
 <style lang="less" scoped>
 .container {
   width: 100%;
   height: 100%;
   display: flex;
   align-items: center;
   justify-content: space-between;
 
   .button {
     flex: 1;
     display: flex;
 
     i {
       margin: auto;
       text-align: center;
       font-size: 3rem;
       padding: 0.5rem;
     }
   }
 }
 </style>