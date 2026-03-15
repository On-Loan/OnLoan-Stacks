(define-constant ERR-NOT-AUTHORIZED (err u1000))
(define-constant ERR-PROTOCOL-PAUSED (err u1001))
(define-constant ERR-ASSET-NOT-FOUND (err u1002))
(define-constant ERR-INVALID-PARAMETER (err u1003))
(define-constant ERR-INVALID-AMOUNT (err u1004))
(define-constant ERR-INSUFFICIENT-BALANCE (err u1005))
(define-constant ERR-BELOW-MIN-COLLATERAL (err u1006))
(define-constant ERR-EXCEEDS-MAX-LTV (err u1007))
(define-constant ERR-POSITION-HEALTHY (err u1008))
(define-constant ERR-ORACLE-STALE (err u1009))
(define-constant ERR-ORACLE-LOW-CONFIDENCE (err u1010))
(define-constant ERR-POOL-INSUFFICIENT-LIQUIDITY (err u1011))
(define-constant ERR-LOAN-NOT-FOUND (err u1012))
(define-constant ERR-ALREADY-LIQUIDATED (err u1013))
(define-constant ERR-UNSUPPORTED-ASSET (err u1014))
(define-constant ERR-INVALID-COLLATERAL-TYPE (err u1015))

(define-data-var contract-owner principal tx-sender)
(define-data-var protocol-paused bool false)
(define-data-var base-interest-rate uint u200)
(define-data-var optimal-utilization uint u8000)
(define-data-var slope1 uint u400)
(define-data-var slope2 uint u7500)
(define-data-var protocol-fee uint u100)

(define-map asset-config
  (string-ascii 12)
  {
    max-ltv: uint,
    liquidation-threshold: uint,
    liquidation-bonus: uint,
    min-collateral: uint,
    is-active: bool,
    is-collateral-enabled: bool,
    is-borrow-enabled: bool
  }
)

(define-map authorized-callers principal bool)

(map-set asset-config "sbtc" {
  max-ltv: u7500,
  liquidation-threshold: u8000,
  liquidation-bonus: u500,
  min-collateral: u10000,
  is-active: true,
  is-collateral-enabled: true,
  is-borrow-enabled: false
})

(map-set asset-config "stx" {
  max-ltv: u6000,
  liquidation-threshold: u7000,
  liquidation-bonus: u800,
  min-collateral: u100000000,
  is-active: true,
  is-collateral-enabled: true,
  is-borrow-enabled: false
})

(map-set asset-config "usdcx" {
  max-ltv: u0,
  liquidation-threshold: u0,
  liquidation-bonus: u0,
  min-collateral: u0,
  is-active: true,
  is-collateral-enabled: false,
  is-borrow-enabled: true
})

(define-public (set-asset-config
    (asset-id (string-ascii 12))
    (max-ltv uint)
    (liquidation-threshold uint)
    (liquidation-bonus uint)
    (min-collateral uint)
    (is-active bool)
    (is-collateral-enabled bool)
    (is-borrow-enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (map-set asset-config asset-id {
      max-ltv: max-ltv,
      liquidation-threshold: liquidation-threshold,
      liquidation-bonus: liquidation-bonus,
      min-collateral: min-collateral,
      is-active: is-active,
      is-collateral-enabled: is-collateral-enabled,
      is-borrow-enabled: is-borrow-enabled
    })
    (ok true)
  )
)

(define-public (set-protocol-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (var-set protocol-paused paused)
    (ok true)
  )
)

(define-public (set-base-interest-rate (rate uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (asserts! (<= rate u10000) ERR-INVALID-PARAMETER)
    (var-set base-interest-rate rate)
    (ok true)
  )
)

(define-public (set-optimal-utilization (rate uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (asserts! (<= rate u10000) ERR-INVALID-PARAMETER)
    (var-set optimal-utilization rate)
    (ok true)
  )
)

(define-public (set-slopes (new-slope1 uint) (new-slope2 uint))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (var-set slope1 new-slope1)
    (var-set slope2 new-slope2)
    (ok true)
  )
)

(define-public (transfer-ownership (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (var-set contract-owner new-owner)
    (ok true)
  )
)

(define-public (set-authorized-caller (caller principal) (authorized bool))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (map-set authorized-callers caller authorized)
    (ok true)
  )
)

(define-read-only (get-asset-config (asset-id (string-ascii 12)))
  (map-get? asset-config asset-id)
)

(define-read-only (get-owner)
  (var-get contract-owner)
)

(define-read-only (is-paused)
  (var-get protocol-paused)
)

(define-read-only (get-interest-params)
  {
    base-rate: (var-get base-interest-rate),
    optimal-utilization: (var-get optimal-utilization),
    slope1: (var-get slope1),
    slope2: (var-get slope2),
    protocol-fee: (var-get protocol-fee)
  }
)

(define-read-only (is-authorized (caller principal))
  (default-to false (map-get? authorized-callers caller))
)

(define-read-only (calculate-interest-rate (utilization uint))
  (let (
    (base (var-get base-interest-rate))
    (optimal (var-get optimal-utilization))
    (s1 (var-get slope1))
    (s2 (var-get slope2))
  )
    (if (<= utilization optimal)
      (+ base (/ (* utilization s1) optimal))
      (+ base s1 (/ (* (- utilization optimal) s2) (- u10000 optimal)))
    )
  )
)
