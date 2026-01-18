{
  description = "linker local dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/544961dfcce86422ba200ed9a0b00dd4b1486ec5"; #v25.05
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };
        
        
        nodejs = pkgs.nodejs_24; # Node.js v24
        
        zcli = pkgs.writeShellScriptBin "zcli" ''
          export PATH="${pkgs.nodejs_24}/bin:$PATH"
          exec npx @zendesk/zcli@1.0.0-beta.53 "$@"
        '';
        
        buildInputs = with pkgs; [
          nodejs
          corepack # auto enable
          zcli
        ];
        
      in
      {
        devShells.default = pkgs.mkShell {
          inherit buildInputs;
          
          shellHook = ''
            # Show versions
            echo "  Node.js: $(node --version)"
            echo "  Pnpm: $(pnpm --version)"
            echo "  zcli: @zendesk/zcli@1.0.0-beta.53"
          '';
          
          packages = buildInputs;
        };
      }
    );
}