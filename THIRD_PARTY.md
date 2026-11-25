# Third-party software and assets

No third-party artwork, audio, fonts or game content is used. The illustrations and icons are original inline SVG written for this project. The interface uses system font stacks (nothing is loaded at runtime from a remote server).

## Runtime dependencies (bundled into the production build)
| Package | Version | Licence |
|---|---|---|
| react | 19.3.1 | MIT |
| react-dom | 19.3.1 | MIT |
| scheduler (dependency of react-dom) | 0.28.0 | MIT |

## Development-only dependencies (not shipped)
| Package | Version | Licence |
|---|---|---|
| vite | 8.3.8 | MIT |
| @vitejs/plugin-react | 6.3.0 | MIT |
| typescript | 7.0.2 | Apache-2.0 |
| vitest | 5.1.2 | MIT |
| tsx | 4.23.15 | MIT |
| @types/react, @types/react-dom, @types/node | 19.3.2 / 19.3.0 / 26.6.10 | MIT |

Licence values are read from each package's `package.json` in `node_modules`. Transitive dependencies of the development tools were not individually audited. `axe-core` (MPL-2.0) was installed temporarily for an accessibility check and removed; it is not in the project.
