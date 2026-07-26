<!DOCTYPE html>
<html lang="sw" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'M-TAI')</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#2563eb',
                        secondary: '#10b981',
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Poppins', system-ui, sans-serif; }
    </style>
</head>
<body class="h-full bg-gray-50">

    {{-- Navbar --}}
    <nav class="bg-white shadow-md sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                {{-- Logo --}}
                <div class="flex items-center">
                    <a href="{{ url('/') }}" class="flex items-center space-x-2">
                        <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                            <span class="text-white font-bold text-xl">M</span>
                        </div>
                        <span class="text-xl font-bold text-gray-800">M-TAI</span>
                    </a>
                </div>

                {{-- Desktop Navigation --}}
                <div class="hidden md:flex items-center space-x-4">
                    @auth
                        <a href="{{ url('/dashboard') }}" class="text-gray-600 hover:text-primary transition">Dashibodi</a>
                        <div class="flex items-center space-x-3 ml-4 border-l pl-4">
                            <span class="text-sm text-gray-500">Karibu, <span class="font-semibold text-gray-800">{{ Auth::user()->name }}</span></span>
                            <form method="POST" action="{{ route('logout') }}">
                                @csrf
                                <button type="submit" class="text-sm text-red-500 hover:text-red-700 transition font-medium">Ondoka</button>
                            </form>
                        </div>
                    @else
                        <a href="{{ url('/login') }}" class="text-gray-600 hover:text-primary transition font-medium">Ingia</a>
                        <a href="{{ url('/register') }}" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">Jiandikishe</a>
                    @endauth
                </div>

                {{-- Mobile menu button --}}
                <div class="md:hidden flex items-center">
                    <button id="mobile-menu-btn" class="text-gray-600 hover:text-primary">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        {{-- Mobile menu --}}
        <div id="mobile-menu" class="hidden md:hidden border-t bg-white">
            <div class="px-4 py-3 space-y-2">
                @auth
                    <a href="{{ url('/dashboard') }}" class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Dashibodi</a>
                    <div class="border-t pt-2 mt-2">
                        <span class="block px-3 py-1 text-sm text-gray-500">Karibu, {{ Auth::user()->name }}</span>
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button type="submit" class="w-full text-left px-3 py-2 rounded-lg text-red-500 hover:bg-red-50">Ondoka</button>
                        </form>
                    </div>
                @else
                    <a href="{{ url('/login') }}" class="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Ingia</a>
                    <a href="{{ url('/register') }}" class="block px-3 py-2 rounded-lg bg-primary text-white text-center hover:bg-blue-700">Jiandikishe</a>
                @endauth
            </div>
        </div>
    </nav>

    {{-- Main Content --}}
    <main>
        @yield('content')
    </main>

    {{-- Footer --}}
    <footer class="bg-gray-800 text-gray-300 mt-auto">
        <div class="max-w-7xl mx-auto px-4 py-6 text-center text-sm">
            &copy; {{ date('Y') }} M-TAI. Haki zote zimehifadhiwa.
        </div>
    </footer>

    <script>
        const btn = document.getElementById('mobile-menu-btn');
        const menu = document.getElementById('mobile-menu');
        if (btn && menu) {
            btn.addEventListener('click', () => menu.classList.toggle('hidden'));
        }
    </script>
    @stack('scripts')
</body>
</html>
