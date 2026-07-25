@extends('layouts.app')

@section('title', 'M-TAI - Jukwaa la Usimamizi wa Biashara')

@section('content')
<div class="min-h-screen">
    {{-- Hero Section --}}
    <section class="bg-gradient-to-br from-primary via-blue-600 to-blue-800 text-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div class="text-center max-w-3xl mx-auto">
                <div class="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                    <span class="w-2 h-2 bg-secondary rounded-full mr-2 animate-pulse"></span>
                    <span class="text-sm text-blue-100">Jukwaa #1 la Usimamizi wa Biashara Tanzania</span>
                </div>
                <h1 class="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
                    M-TAI<br>
                    <span class="text-secondary">Jukwaa la Usimamizi wa Biashara</span>
                </h1>
                <p class="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed">
                    Simamia biashara yako kwa urahisi. Bidhaa, wateja, stok, mauzo, uwasilishaji, na ripoti — kila kitu kwa mtandao mmoja.
                </p>
                <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <a href="{{ url('/register') }}" class="w-full sm:w-auto bg-secondary hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        Anza Sasa — Bure
                    </a>
                    <a href="{{ url('/login') }}" class="w-full sm:w-auto bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-4 rounded-xl font-bold text-lg transition border border-white/20">
                        Ingia
                    </a>
                </div>
            </div>
        </div>
        {{-- Wave divider --}}
        <div class="relative h-16">
            <svg class="absolute bottom-0 w-full h-16 text-gray-50" preserveAspectRatio="none" viewBox="0 0 1200 120" fill="currentColor">
                <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"/>
                <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"/>
                <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"/>
            </svg>
        </div>
    </section>

    {{-- Features Section --}}
    <section class="py-20 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Kila Kitu Unachohitaji</h2>
                <p class="text-gray-500 text-lg max-w-2xl mx-auto">M-TAI inakupa zana zote kusimamia biashara yako kwa ufanisi.</p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {{-- Biashara --}}
                <div class="bg-white rounded-2xl p-8 shadow-sm border hover:shadow-lg transition group">
                    <div class="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-primary/20 transition">
                        <svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 mb-2">Biashara</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">Unda na simamia duka lako. Ongeza bidhaa, weka bei, na fuatilia mauzo yako.</p>
                </div>

                {{-- Ununuzi --}}
                <div class="bg-white rounded-2xl p-8 shadow-sm border hover:shadow-lg transition group">
                    <div class="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-5 group-hover:bg-secondary/20 transition">
                        <svg class="w-7 h-7 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 mb-2">Ununuzi</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">Weka maagizo kwa urahisi. Chagua bidhaa, weka kiasi, na lipa kwa njia yoyote.</p>
                </div>

                {{-- Uwasilishaji --}}
                <div class="bg-white rounded-2xl p-8 shadow-sm border hover:shadow-lg transition group">
                    <div class="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-amber-100 transition">
                        <svg class="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 mb-2">Uwasilishaji</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">Fuatilia usafirishaji wa maagizo. Wateja wapata taarifa za wakati halisi.</p>
                </div>

                {{-- Usimamizi --}}
                <div class="bg-white rounded-2xl p-8 shadow-sm border hover:shadow-lg transition group">
                    <div class="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-purple-100 transition">
                        <svg class="w-7 h-7 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                    </div>
                    <h3 class="text-lg font-bold text-gray-800 mb-2">Usimamizi</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">Ripoti za kina, stok, mikopo, gharama, na mapato — kila kitu sehemu moja.</p>
                </div>
            </div>
        </div>
    </section>

    {{-- How it Works --}}
    <section class="py-20 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Jinsi Inavyofanya Kazi</h2>
                <p class="text-gray-500 text-lg">Hatua tatu tu kuanza.</p>
            </div>

            <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div class="text-center">
                    <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                    <h3 class="font-bold text-gray-800 mb-2">Jiandikishe</h3>
                    <p class="text-gray-500 text-sm">Unda akaunti yako bila malipo.</p>
                </div>
                <div class="text-center">
                    <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                    <h3 class="font-bold text-gray-800 mb-2">Weka Bidhaa</h3>
                    <p class="text-gray-500 text-sm">Ongeza bidhaa zako na bei zao.</p>
                </div>
                <div class="text-center">
                    <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                    <h3 class="font-bold text-gray-800 mb-2">Anza Kuuza</h3>
                    <p class="text-gray-500 text-sm">Pokea maagizo na uwasilishe kwa wateja.</p>
                </div>
            </div>
        </div>
    </section>

    {{-- CTA Section --}}
    <section class="py-20 bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Uko Tayari Kuanza?</h2>
            <p class="text-gray-500 text-lg mb-8">Jiunge na biashara nyingi zinazotumia M-TAI kusimamia shughuli zao.</p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="{{ url('/register') }}" class="w-full sm:w-auto bg-primary hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    Anza Sasa
                </a>
                <a href="{{ url('/login') }}" class="w-full sm:w-auto bg-white hover:bg-gray-100 text-primary px-8 py-4 rounded-xl font-bold text-lg transition border border-gray-200">
                    Ingia
                </a>
            </div>
        </div>
    </section>
</div>
@endsection
