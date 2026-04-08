{
  description = "Ramsevka custom Iosevka build plans";

  inputs = {
    nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1"; # tracks nixpkgs unstable branch
    iosevka-upstream = {
      url = "github:be5invis/Iosevka?ref=refs/tags/v34.3.0";
      flake = false;
    };
  };

  outputs = {
    self,
    nixpkgs,
    ...
  } @ inputs: let
    systems = ["x86_64-linux" "aarch64-linux"];
    forEachSystem = nixpkgs.lib.genAttrs systems;
    pkgsForEach = nixpkgs.legacyPackages;
  in {
    packages = forEachSystem (system: let
      pkgs = pkgsForEach.${system};
      base = pkgs.callPackage ./nix/ramsevka-base.nix {inherit inputs self;};
    in {
      ramsevka-mono = base.override {
        variant = "Mono";
        features = "ttf";
      };

      ramsevka-term = base.override {
        variant = "Term";
        features = "ttf";
      };

      ramsevka-mono-nerd = base.override {
        variant = "Mono";
        features = "ttf";
        nerdfont = true;
      };

      ramsevka-term-nerd = base.override {
        variant = "Term";
        features = "ttf";
        nerdfont = true;
      };

      ramsevka-full = pkgs.linkFarmFromDrvs "ramsevka-full" [
        self.packages.${system}.ramsevka-mono
        self.packages.${system}.ramsevka-term
        self.packages.${system}.ramsevka-mono-nerd
        self.packages.${system}.ramsevka-term-nerd
      ];
    });

    devShells = forEachSystem (system: let
      pkgs = pkgsForEach.${system};
    in {
      default = pkgs.mkShell {
        packages = [
          # For generating font previews
          (pkgs.python3.withPackages (python-pkgs:
            with python-pkgs; [
              pillow
              matplotlib
            ]))
        ];
      };
    });

    hydraJobs = self.packages;
  };
}
