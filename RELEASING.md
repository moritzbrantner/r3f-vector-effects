# Releasing

Use this checklist for each npm release.

1. Update `CHANGELOG.md` so the target version has a dated section.
2. Update `package.json` with the new version.
3. Install dependencies with `bun install --frozen-lockfile`.
4. Run `bun run pack:check`.
5. Inspect `npm pack --dry-run` output and verify `LICENSE`, `README.md`, `CHANGELOG.md`, and `dist` are included.
6. Publish with `npm publish --access public`.
7. Create and push a matching git tag.

The `pack:check` script validates linting, types, tests, package build, example builds, benchmark build, package import smoke tests, TypeScript declaration consumption, and package tarball contents.
