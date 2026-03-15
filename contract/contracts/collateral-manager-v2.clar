(define-map collateral-positions
  {user: principal, collateral-type: (string-ascii 12)}
  {
    collateral-amount: uint,
    borrowed-amount: uint,
    deposit-block: uint,
    last-interest-block: uint,
    is-active: bool
  }
)

(define-data-var position-count uint u0)
(define-data-var contract-addr principal tx-sender)

(as-contract? ()
  (var-set contract-addr tx-sender)
)

(define-public (deposit-collateral-stx (amount uint))
  (let (
    (config (unwrap! (contract-call? .onloan-core-v2 get-asset-config "stx") (err u1002)))
    (existing (default-to
      {collateral-amount: u0, borrowed-amount: u0, deposit-block: stacks-block-height, last-interest-block: stacks-block-height, is-active: false}
      (map-get? collateral-positions {user: tx-sender, collateral-type: "stx"})))
    (new-collateral (+ (get collateral-amount existing) amount))
  )
    (asserts! (not (contract-call? .onloan-core-v2 is-paused)) (err u1001))
    (asserts! (> amount u0) (err u1004))
    (asserts! (>= new-collateral (get min-collateral config)) (err u1006))
    (try! (stx-transfer? amount tx-sender (var-get contract-addr)))
    (map-set collateral-positions {user: tx-sender, collateral-type: "stx"} (merge existing {
      collateral-amount: new-collateral,
      deposit-block: (if (get is-active existing) (get deposit-block existing) stacks-block-height),
      last-interest-block: (if (get is-active existing) (get last-interest-block existing) stacks-block-height),
      is-active: true
    }))
    (if (not (get is-active existing))
      (var-set position-count (+ (var-get position-count) u1))
      true
    )
    (print {event: "deposit-collateral", user: tx-sender, collateral-type: "stx", amount: amount})
    (ok amount)
  )
)

(define-public (deposit-collateral-sbtc (amount uint))
  (let (
    (config (unwrap! (contract-call? .onloan-core-v2 get-asset-config "sbtc") (err u1002)))
    (existing (default-to
      {collateral-amount: u0, borrowed-amount: u0, deposit-block: stacks-block-height, last-interest-block: stacks-block-height, is-active: false}
      (map-get? collateral-positions {user: tx-sender, collateral-type: "sbtc"})))
    (new-collateral (+ (get collateral-amount existing) amount))
  )
    (asserts! (not (contract-call? .onloan-core-v2 is-paused)) (err u1001))
    (asserts! (> amount u0) (err u1004))
    (asserts! (>= new-collateral (get min-collateral config)) (err u1006))
    (try! (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token transfer amount tx-sender (var-get contract-addr) none))
    (map-set collateral-positions {user: tx-sender, collateral-type: "sbtc"} (merge existing {
      collateral-amount: new-collateral,
      deposit-block: (if (get is-active existing) (get deposit-block existing) stacks-block-height),
      last-interest-block: (if (get is-active existing) (get last-interest-block existing) stacks-block-height),
      is-active: true
    }))
    (if (not (get is-active existing))
      (var-set position-count (+ (var-get position-count) u1))
      true
    )
    (print {event: "deposit-collateral", user: tx-sender, collateral-type: "sbtc", amount: amount})
    (ok amount)
  )
)

(define-public (borrow (amount uint) (collateral-type (string-ascii 12)))
  (let (
    (position (unwrap! (map-get? collateral-positions {user: tx-sender, collateral-type: collateral-type}) (err u1012)))
    (price-data (try! (contract-call? .pyth-oracle-adapter-v2 get-price collateral-type)))
    (price (get price price-data))
    (collateral-value (/ (* (get collateral-amount position) price) u100000000))
    (config (unwrap! (contract-call? .onloan-core-v2 get-asset-config collateral-type) (err u1002)))
    (max-borrow (/ (* collateral-value (get max-ltv config)) u10000))
    (new-borrowed (+ (get borrowed-amount position) amount))
  )
    (asserts! (not (contract-call? .onloan-core-v2 is-paused)) (err u1001))
    (asserts! (> amount u0) (err u1004))
    (asserts! (get is-active position) (err u1012))
    (asserts! (<= new-borrowed max-borrow) (err u1007))
    (asserts! (>= (contract-call? .lending-pool-v2 get-available-liquidity "usdcx") amount) (err u1011))
    (try! (contract-call? .lending-pool-v2 add-borrows amount "usdcx"))
    (map-set collateral-positions {user: tx-sender, collateral-type: collateral-type} (merge position {
      borrowed-amount: new-borrowed,
      last-interest-block: stacks-block-height
    }))
    (print {event: "borrow", user: tx-sender, collateral-type: collateral-type, amount: amount})
    (ok amount)
  )
)

(define-public (repay (amount uint) (collateral-type (string-ascii 12)))
  (let (
    (position (unwrap! (map-get? collateral-positions {user: tx-sender, collateral-type: collateral-type}) (err u1012)))
  )
    (asserts! (not (contract-call? .onloan-core-v2 is-paused)) (err u1001))
    (asserts! (> amount u0) (err u1004))
    (asserts! (<= amount (get borrowed-amount position)) (err u1005))
    (try! (contract-call? .lending-pool-v2 reduce-borrows amount "usdcx"))
    (map-set collateral-positions {user: tx-sender, collateral-type: collateral-type} (merge position {
      borrowed-amount: (- (get borrowed-amount position) amount),
      last-interest-block: stacks-block-height
    }))
    (print {event: "repay", user: tx-sender, collateral-type: collateral-type, amount: amount})
    (ok amount)
  )
)

(define-public (withdraw-collateral (amount uint) (collateral-type (string-ascii 12)))
  (let (
    (caller tx-sender)
    (position (unwrap! (map-get? collateral-positions {user: tx-sender, collateral-type: collateral-type}) (err u1012)))
    (remaining-collateral (- (get collateral-amount position) amount))
  )
    (asserts! (not (contract-call? .onloan-core-v2 is-paused)) (err u1001))
    (asserts! (> amount u0) (err u1004))
    (asserts! (>= (get collateral-amount position) amount) (err u1005))
    (if (> (get borrowed-amount position) u0)
      (let (
        (price-data (try! (contract-call? .pyth-oracle-adapter-v2 get-price collateral-type)))
        (price (get price price-data))
        (remaining-value (/ (* remaining-collateral price) u100000000))
        (config (unwrap! (contract-call? .onloan-core-v2 get-asset-config collateral-type) (err u1002)))
        (health (/ (* remaining-value (get liquidation-threshold config)) (* (get borrowed-amount position) u10000)))
      )
        (asserts! (>= health u10000) (err u1007))
        true
      )
      true
    )
    (if (is-eq collateral-type "stx")
      (try! (as-contract? ((with-stx amount))
        (try! (stx-transfer? amount tx-sender caller))
      ))
      (try! (as-contract? ((with-ft 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token "sbtc-token" amount))
        (try! (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token transfer amount tx-sender caller none))
      ))
    )
    (map-set collateral-positions {user: caller, collateral-type: collateral-type} (merge position {
      collateral-amount: remaining-collateral,
      is-active: (> remaining-collateral u0)
    }))
    (print {event: "withdraw-collateral", user: caller, collateral-type: collateral-type, amount: amount})
    (ok amount)
  )
)

(define-public (liquidate-collateral (borrower principal) (collateral-type (string-ascii 12)) (repay-amount uint) (collateral-to-seize uint) (liquidator principal))
  (let (
    (position (unwrap! (map-get? collateral-positions {user: borrower, collateral-type: collateral-type}) (err u1012)))
    (new-borrowed (- (get borrowed-amount position) repay-amount))
    (new-collateral (- (get collateral-amount position) collateral-to-seize))
  )
    (asserts! (contract-call? .onloan-core-v2 is-authorized contract-caller) (err u1000))
    (asserts! (<= collateral-to-seize (get collateral-amount position)) (err u1005))
    (asserts! (<= repay-amount (get borrowed-amount position)) (err u1005))
    (if (is-eq collateral-type "stx")
      (try! (as-contract? ((with-stx collateral-to-seize))
        (try! (stx-transfer? collateral-to-seize tx-sender liquidator))
      ))
      (try! (as-contract? ((with-ft 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token "sbtc-token" collateral-to-seize))
        (try! (contract-call? 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token transfer collateral-to-seize tx-sender liquidator none))
      ))
    )
    (map-set collateral-positions {user: borrower, collateral-type: collateral-type} (merge position {
      borrowed-amount: new-borrowed,
      collateral-amount: new-collateral,
      is-active: (> new-collateral u0)
    }))
    (ok true)
  )
)

(define-read-only (get-position (user principal) (collateral-type (string-ascii 12)))
  (map-get? collateral-positions {user: user, collateral-type: collateral-type})
)

(define-read-only (get-health-factor (user principal) (collateral-type (string-ascii 12)))
  (let (
    (position (unwrap! (map-get? collateral-positions {user: user, collateral-type: collateral-type}) (err u1012)))
  )
    (if (is-eq (get borrowed-amount position) u0)
      (ok u99999)
      (let (
        (price-data (try! (contract-call? .pyth-oracle-adapter-v2 get-price collateral-type)))
        (price (get price price-data))
        (collateral-value (/ (* (get collateral-amount position) price) u100000000))
        (config (unwrap! (contract-call? .onloan-core-v2 get-asset-config collateral-type) (err u1002)))
        (health (/ (* collateral-value (get liquidation-threshold config)) (* (get borrowed-amount position) u10000)))
      )
        (ok health)
      )
    )
  )
)

(define-read-only (get-borrow-quote (collateral-type (string-ascii 12)) (collateral-amount uint))
  (let (
    (price-data (try! (contract-call? .pyth-oracle-adapter-v2 get-price collateral-type)))
    (price (get price price-data))
    (config (unwrap! (contract-call? .onloan-core-v2 get-asset-config collateral-type) (err u1002)))
    (collateral-value-usd (/ (* collateral-amount price) u100000000))
    (max-borrowable (/ (* collateral-value-usd (get max-ltv config)) u10000))
  )
    (ok {
      collateral-value-usd: collateral-value-usd,
      max-borrowable-usdcx: max-borrowable,
      current-ltv: (get max-ltv config),
      health-factor: u10000,
      oracle-price: price,
      asset-ltv-limit: (get max-ltv config)
    })
  )
)

(define-read-only (get-ltv-ratio (user principal) (collateral-type (string-ascii 12)))
  (let (
    (position (unwrap! (map-get? collateral-positions {user: user, collateral-type: collateral-type}) (err u1012)))
    (price-data (try! (contract-call? .pyth-oracle-adapter-v2 get-price collateral-type)))
    (price (get price price-data))
    (collateral-value (/ (* (get collateral-amount position) price) u100000000))
  )
    (if (is-eq collateral-value u0)
      (ok u0)
      (ok (/ (* (get borrowed-amount position) u10000) collateral-value))
    )
  )
)
