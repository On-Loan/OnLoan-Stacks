(define-map pool-state
  {asset-id: (string-ascii 12)}
  {
    total-deposits: uint,
    total-borrows: uint,
    total-reserves: uint,
    last-update-block: uint
  }
)

(define-map lender-deposits
  {lender: principal, asset-id: (string-ascii 12)}
  {amount: uint, deposit-block: uint}
)

(define-data-var contract-addr principal tx-sender)

(as-contract? ()
  (var-set contract-addr tx-sender)
)

(map-set pool-state {asset-id: "usdcx"} {total-deposits: u0, total-borrows: u0, total-reserves: u0, last-update-block: u0})
(map-set pool-state {asset-id: "sbtc"} {total-deposits: u0, total-borrows: u0, total-reserves: u0, last-update-block: u0})
(map-set pool-state {asset-id: "stx"} {total-deposits: u0, total-borrows: u0, total-reserves: u0, last-update-block: u0})

(define-public (deposit (amount uint) (asset-id (string-ascii 12)))
  (let (
    (pool (default-to
      {total-deposits: u0, total-borrows: u0, total-reserves: u0, last-update-block: u0}
      (map-get? pool-state {asset-id: asset-id})))
    (existing (default-to
      {amount: u0, deposit-block: stacks-block-height}
      (map-get? lender-deposits {lender: tx-sender, asset-id: asset-id})))
  )
    (asserts! (not (contract-call? .onloan-core-v2 is-paused)) (err u1001))
    (asserts! (> amount u0) (err u1004))
    (if (is-eq asset-id "stx")
      (try! (stx-transfer? amount tx-sender (var-get contract-addr)))
      (if (is-eq asset-id "sbtc")
        (try! (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token transfer amount tx-sender (var-get contract-addr) none))
        (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx transfer amount tx-sender (var-get contract-addr) none))
      )
    )
    (map-set pool-state {asset-id: asset-id} (merge pool {
      total-deposits: (+ (get total-deposits pool) amount),
      last-update-block: stacks-block-height
    }))
    (map-set lender-deposits {lender: tx-sender, asset-id: asset-id} {
      amount: (+ (get amount existing) amount),
      deposit-block: stacks-block-height
    })
    (print {event: "deposit", lender: tx-sender, asset-id: asset-id, amount: amount})
    (ok amount)
  )
)

(define-public (withdraw (amount uint) (asset-id (string-ascii 12)))
  (let (
    (caller tx-sender)
    (existing (unwrap! (map-get? lender-deposits {lender: tx-sender, asset-id: asset-id}) (err u1005)))
    (pool (unwrap! (map-get? pool-state {asset-id: asset-id}) (err u1002)))
  )
    (asserts! (not (contract-call? .onloan-core-v2 is-paused)) (err u1001))
    (asserts! (> amount u0) (err u1004))
    (asserts! (>= (get amount existing) amount) (err u1005))
    (asserts! (>= (- (get total-deposits pool) (get total-borrows pool)) amount) (err u1011))
    (if (is-eq asset-id "stx")
      (try! (as-contract? ((with-stx amount))
        (try! (stx-transfer? amount tx-sender caller))
      ))
      (if (is-eq asset-id "sbtc")
        (try! (as-contract? ((with-ft 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token "sbtc-token" amount))
          (try! (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token transfer amount tx-sender caller none))
        ))
        (try! (as-contract? ((with-ft 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx "usdcx-token" amount))
          (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx transfer amount tx-sender caller none))
        ))
      )
    )
    (map-set pool-state {asset-id: asset-id} (merge pool {
      total-deposits: (- (get total-deposits pool) amount),
      last-update-block: stacks-block-height
    }))
    (map-set lender-deposits {lender: caller, asset-id: asset-id} {
      amount: (- (get amount existing) amount),
      deposit-block: (get deposit-block existing)
    })
    (print {event: "withdraw", lender: caller, asset-id: asset-id, amount: amount})
    (ok amount)
  )
)

(define-public (add-borrows (amount uint) (asset-id (string-ascii 12)))
  (begin
    (asserts! (contract-call? .onloan-core-v2 is-authorized contract-caller) (err u1000))
    (let (
      (borrower tx-sender)
      (pool (unwrap! (map-get? pool-state {asset-id: asset-id}) (err u1002)))
    )
      (if (is-eq asset-id "usdcx")
        (try! (as-contract? ((with-ft 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx "usdcx-token" amount))
          (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx transfer amount tx-sender borrower none))
        ))
        true
      )
      (map-set pool-state {asset-id: asset-id} (merge pool {
        total-borrows: (+ (get total-borrows pool) amount),
        last-update-block: stacks-block-height
      }))
      (ok true)
    )
  )
)

(define-public (reduce-borrows (amount uint) (asset-id (string-ascii 12)))
  (begin
    (asserts! (contract-call? .onloan-core-v2 is-authorized contract-caller) (err u1000))
    (let (
      (pool (unwrap! (map-get? pool-state {asset-id: asset-id}) (err u1002)))
    )
      (if (is-eq asset-id "usdcx")
        (try! (contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx transfer amount tx-sender (var-get contract-addr) none))
        true
      )
      (map-set pool-state {asset-id: asset-id} (merge pool {
        total-borrows: (- (get total-borrows pool) amount),
        last-update-block: stacks-block-height
      }))
      (ok true)
    )
  )
)

(define-read-only (get-pool-stats (asset-id (string-ascii 12)))
  (map-get? pool-state {asset-id: asset-id})
)

(define-read-only (get-lender-balance (lender principal) (asset-id (string-ascii 12)))
  (map-get? lender-deposits {lender: lender, asset-id: asset-id})
)

(define-read-only (get-available-liquidity (asset-id (string-ascii 12)))
  (match (map-get? pool-state {asset-id: asset-id})
    pool (- (get total-deposits pool) (get total-borrows pool))
    u0
  )
)

(define-read-only (get-utilization-rate (asset-id (string-ascii 12)))
  (match (map-get? pool-state {asset-id: asset-id})
    pool (if (is-eq (get total-deposits pool) u0)
      u0
      (/ (* (get total-borrows pool) u10000) (get total-deposits pool)))
    u0
  )
)
