<script setup></script>

<template>
  <div
    class="h-screen p-5 bg-black text-white flex flex-col gap-5 justify-center"
  >
    <h1 class="text-center text-6xl font-bold">Navigation</h1>
    <p class="text-center text-xl">Our most powerfully nav application</p>
    <div class="flex items-center justify-center gap-5">
      <button class="text-xl py-3 px-6 bg-blue-500 rounded-full">
        Learn More
      </button>
      <router-link to="/customer">
        <button
          class="text-xl py-3 px-6 text-blue-500 border border-blue-500 rounded-full"
        >
          Try Free
        </button>
      </router-link>
    </div>
  </div>
</template>
