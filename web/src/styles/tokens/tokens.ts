// OmniXtra Design Tokens - generated from tokens.json. Do not edit by hand.
// Source: omnixtra-canonical-tokens.json (Figma MCP get_variable_defs), single/default mode only.
// Semantic color VALUES are the extracted resolved values (directly usable). Alias relationships
// live in tokens.json ($ref) and tokens.css (var()); unresolved neutral aliases were NOT invented.
// typography.letterSpacing is Figma RAW units (unit unverified) - preserved, not converted.

export const tokens = {
  "primitive": {
    "color": {
      "red": {
        "lighter": "#fdedf0",
        "light": "#f8c9d2",
        "base": "#df1c41",
        "dark": "#af1d38"
      },
      "green": {
        "lighter": "#effaf6",
        "base": "#38c793"
      },
      "orange": {
        "lighter": "#fef3eb",
        "base": "#f17b2c"
      },
      "blue": {
        "light": "#c2d6ff",
        "base": "#375dfb"
      },
      "yellow": {
        "light": "#fbdfb1"
      },
      "teal": {
        "light": "#c2efff"
      },
      "purple": {
        "light": "#cac2ff"
      },
      "light-indigo": {
        "50": "#eeedfc",
        "500": "#584ce1",
        "600": "#4b41bf",
        "700": "#3e359e",
        "800": "#302a7c",
        "900": "#231e5a"
      }
    },
    "radius": {
      "8": "8px"
    }
  },
  "semantic": {
    "color": {
      "bg": {
        "white-0": "#ffffff",
        "weak-100": "#f6f8fa",
        "soft-200": "#e2e4e9",
        "surface-700": "#20232d",
        "strong-900": "#0a0d14"
      },
      "text": {
        "white-0": "#ffffff",
        "disabled-300": "#cdd0d5",
        "soft-400": "#868c98",
        "sub-500": "#525866",
        "main-900": "#0a0d14"
      },
      "icon": {
        "white-0": "#ffffff",
        "disabled-300": "#cdd0d5",
        "soft-400": "#868c98",
        "sub-500": "#525866",
        "strong-900": "#0a0d14"
      },
      "stroke": {
        "white-0": "#ffffff",
        "soft-200": "#e2e4e9",
        "sub-300": "#cdd0d5",
        "strong-900": "#0a0d14"
      },
      "primary": {
        // Brand override: Figma confirms semantic primary is light-indigo/500, not blue/base.
        "lighter": "#eeedfc",
        "base": "#584ce1",
        "dark": "#4b41bf"
      },
      "state": {
        "success": "#38c793",
        "warning": "#f17b2c",
        "error": "#df1c41",
        "neutral": "#868c98"
      }
    }
  },
  "component": {
    "shadow": {
      "button": {
        "stroke": {
          "primary": "0px 1px 2px 0px rgba(88, 76, 225, 0.078)",
          "important": "0px 1px 2px 0px rgba(82, 88, 102, 0.059)",
          "error": "0px 1px 2px 0px rgba(233, 53, 53, 0.078)"
        },
        "focus": {
          "primary": "0px 0px 0px 4px rgba(238, 237, 252, 1), 0px 0px 0px 2px rgba(255, 255, 255, 1)",
          "important": "0px 0px 0px 4px rgba(228, 229, 231, 1), 0px 0px 0px 2px rgba(255, 255, 255, 1)",
          "error": "0px 0px 0px 4px rgba(255, 236, 235, 1), 0px 0px 0px 2px rgba(255, 255, 255, 1)"
        }
      },
      "radio-checkbox": {
        "default": "0px 2px 2px 0px rgba(27, 28, 29, 0.122)",
        "active-bg": "inset 0px 2px 2px 0px rgba(22, 38, 100, 0.322)",
        "disabled": "inset 0px 2px 2px 0px rgba(15, 15, 16, 0.078)"
      },
      "switch-toggle": {
        "active": "0px 2px 4px 0px rgba(27, 28, 29, 0.02), 0px 6px 10px 0px rgba(27, 28, 29, 0.059)"
      }
    }
  },
  "typography": {
    "title": {
      "h1": {
        "fontFamily": "Mulish",
        "fontWeight": 700,
        "fontSize": "56px",
        "lineHeight": "64px",
        "letterSpacing": -4
      },
      "h2": {
        "fontFamily": "Mulish",
        "fontWeight": 700,
        "fontSize": "48px",
        "lineHeight": "56px",
        "letterSpacing": -3
      },
      "h3": {
        "fontFamily": "Mulish",
        "fontWeight": 600,
        "fontSize": "40px",
        "lineHeight": "48px",
        "letterSpacing": -5
      },
      "h4": {
        "fontFamily": "Mulish",
        "fontWeight": 700,
        "fontSize": "32px",
        "lineHeight": "40px",
        "letterSpacing": -3
      },
      "h5": {
        "fontFamily": "Mulish",
        "fontWeight": 700,
        "fontSize": "24px",
        "lineHeight": "32px",
        "letterSpacing": -4
      },
      "h6": {
        "fontFamily": "Mulish",
        "fontWeight": 700,
        "fontSize": "20px",
        "lineHeight": "28px",
        "letterSpacing": -3
      }
    },
    "label": {
      "x-large": {
        "fontFamily": "Mulish",
        "fontWeight": 700,
        "fontSize": "24px",
        "lineHeight": "32px",
        "letterSpacing": -3
      },
      "large": {
        "fontFamily": "Mulish",
        "fontWeight": 600,
        "fontSize": "18px",
        "lineHeight": "24px",
        "letterSpacing": -3
      },
      "medium": {
        "fontFamily": "Mulish",
        "fontWeight": 600,
        "fontSize": "16px",
        "lineHeight": "24px",
        "letterSpacing": -2
      },
      "small": {
        "fontFamily": "Mulish",
        "fontWeight": 600,
        "fontSize": "14px",
        "lineHeight": "20px",
        "letterSpacing": -2
      },
      "x-small": {
        "fontFamily": "Mulish",
        "fontWeight": 500,
        "fontSize": "12px",
        "lineHeight": "16px",
        "letterSpacing": -3
      }
    },
    "paragraph": {
      "x-large": {
        "fontFamily": "Mulish",
        "fontWeight": 400,
        "fontSize": "24px",
        "lineHeight": "32px",
        "letterSpacing": -3
      },
      "large": {
        "fontFamily": "Mulish",
        "fontWeight": 400,
        "fontSize": "18px",
        "lineHeight": "24px",
        "letterSpacing": -2
      },
      "medium": {
        "fontFamily": "Mulish",
        "fontWeight": 400,
        "fontSize": "16px",
        "lineHeight": "24px",
        "letterSpacing": -1.1
      },
      "small": {
        "fontFamily": "Mulish",
        "fontWeight": 500,
        "fontSize": "14px",
        "lineHeight": "20px",
        "letterSpacing": -4
      },
      "x-small": {
        "fontFamily": "Mulish",
        "fontWeight": 400,
        "fontSize": "12px",
        "lineHeight": "16px",
        "letterSpacing": -2
      }
    },
    "subheading": {
      "medium": {
        "fontFamily": "Mulish",
        "fontWeight": 500,
        "fontSize": "16px",
        "lineHeight": "24px",
        "letterSpacing": 6
      },
      "small": {
        "fontFamily": "Mulish",
        "fontWeight": 500,
        "fontSize": "14px",
        "lineHeight": "20px",
        "letterSpacing": 6
      },
      "x-small": {
        "fontFamily": "Mulish",
        "fontWeight": 500,
        "fontSize": "12px",
        "lineHeight": "16px",
        "letterSpacing": 4
      },
      "2x-small": {
        "fontFamily": "Mulish",
        "fontWeight": 500,
        "fontSize": "11px",
        "lineHeight": "12px",
        "letterSpacing": -2
      }
    },
    "docs": {
      "paragraph": {
        "fontFamily": "Mulish",
        "fontWeight": 400,
        "fontSize": "18px",
        "lineHeight": "32px",
        "letterSpacing": -3
      }
    }
  },
  "effect": {
    "shadow": {
      "x-small": "0px 1px 2px 0px rgba(228, 229, 231, 0.239)",
      "small": "0px 2px 4px 0px rgba(27, 28, 29, 0.039)",
      "medium": "0px 16px 32px -12px rgba(88, 92, 95, 0.102)",
      "large": "0px 16px 40px -8px rgba(88, 92, 95, 0.161)",
      "x-large": "0px 24px 56px -4px rgba(88, 92, 95, 0.161)",
      "2x-large": "0px 40px 96px -8px rgba(88, 92, 95, 0.2)"
    }
  },
  "legacy": {
    "color": {
      "red-error": {
        "100": "#E1004B",
        "200": "#D80027"
      }
    }
  }
} as const;

export type Tokens = typeof tokens;
