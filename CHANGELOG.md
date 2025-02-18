## [1.1.2-1.1.3] - 2025-02-18
### Fixed
- Some refactoring for better code readability

## [1.1.1] - 2025-02-15
### Fixed
- Several function type signature
- Rewritten the whole library for better readability

## [1.1.0] - 2025-02-15
### Added
- `mapIf` and `flatMapIf` for conditional mapping

## [1.0.0] - 2025-02-15
### Fixed
- Function signature of `filter` and `filterNot` changed to return an Error (or an instance deriving from it) instead of nothing.

## [0.8.0] - 2025-02-14
### Added
- `andFinally` method for running code independent on the state

### Fixed
- Added missing tests for `andThen`
- Fixed README description for `filter` and `filterNot`