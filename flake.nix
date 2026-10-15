{
  description = "clm stats devshell";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    flake-root.url = "github:srid/flake-root";
    spago.url = "github:mitchdzugan/nix-spago";
    tsdown.url = "github:mitchdzugan/nix-tsdown";
  };
  outputs = inputs: (
    inputs.flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [ inputs.flake-root.flakeModule ];
      perSystem = { pkgs, system, config, ... }: {
        devShells = {
          default = pkgs.mkShell {
            inputsFrom = [ config.flake-root.devShell ];
            buildInputs = [
              pkgs.nodejs_26
              pkgs.purescript
              inputs.tsdown.packages.${system}.tsdown
              inputs.spago.packages.${system}.spago
              (pkgs.writeShellScriptBin "build" ''
                cd $FLAKE_ROOT
                npm ci
                npx rimraf dist
                npm run build:purescript
                npm run build:js
                npm run build:css
              '')
            ];
          };
        };
      };
      systems = inputs.nixpkgs.lib.systems.flakeExposed;
    }
  );
}
