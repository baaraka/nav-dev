<script setup>
import Navbar from "@/components/navs/Navbar.vue";
</script>

<template>
  <div class="h-screen">
    <Navbar />
    <main class="flex-grow">
      <router-view></router-view>
    </main>
  </div>
</template>
