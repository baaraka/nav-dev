<script setup></script>

<template>
  <div
    class="flex p-5 container items-center justify-between bg-[#222121] shadow-md text-white h-20"
  >
    <router-link to="/">
      <h1 class="text-3xl font-bold">Navigation</h1>
    </router-link>

    <div class="flex items-center gap-5">
      <router-link to="/customer"
        ><span class="text-xl">Customer</span></router-link
      >
      <router-link to="/rider"><span class="text-xl">Rider</span></router-link>
    </div>
  </div>
</template>
