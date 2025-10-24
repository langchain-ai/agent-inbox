import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		keyframes: {
  			'gradient-xy-enhanced': {
  				'0%, 100%': {
  					'background-size': '400% 400%',
  					'background-position': 'left center',
  					transform: 'rotate(-3deg)'
  				},
  				'50%': {
  					'background-size': '200% 200%',
  					'background-position': 'right center',
  					transform: 'rotate(3deg)'
  				}
  			},
  			'gradient-x': {
  				'0%, 100%': {
  					'background-size': '200% 200%',
  					'background-position': 'left center'
  				},
  				'50%': {
  					'background-size': '200% 200%',
  					'background-position': 'right center'
  				}
  			},
  			'float': {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-8px)'
  				}
  			},
  			'sparkle': {
  				'0%, 100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				},
  				'50%': {
  					opacity: '0.6',
  					transform: 'scale(1.2)'
  				}
  			},
  			'wiggle': {
  				'0%, 100%': {
  					transform: 'rotate(-3deg)'
  				},
  				'50%': {
  					transform: 'rotate(3deg)'
  				}
  			}
  		},
  		animation: {
  			'gradient-xy-enhanced': 'gradient-xy-enhanced 15s ease infinite',
  			'gradient-x': 'gradient-x 3s ease-in-out infinite',
  			'float': 'float 3s ease-in-out infinite',
  			'sparkle': 'sparkle 2s ease-in-out infinite',
  			'wiggle': 'wiggle 1s ease-in-out infinite'
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			xl: '1.5rem',
  			'2xl': '2rem',
  			'3xl': '3rem'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
			fontFamily: {
        mono: [
          `"Fira Code"`,
          `ui-monospace`,
          `SFMono-Regular`,
          `Menlo`,
          `Monaco`,
          `Consolas`,
          `"Liberation Mono"`,
          `"Courier New"`,
          `monospace`,
        ],
				sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          'Segoe UI',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
        ],
      },
      letterSpacing: {
  			tighter: '-0.04em'
  		}
  	}
  },
  plugins: [
    require("tailwind-scrollbar-hide"),
    require("tailwindcss-animate"),
    require("@assistant-ui/react/tailwindcss")({
      components: ["thread"],
    }),
		require('tailwind-scrollbar'),
  ],
};
export default config;
