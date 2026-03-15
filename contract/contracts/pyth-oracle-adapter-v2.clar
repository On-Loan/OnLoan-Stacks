(impl-trait .oracle-trait-v2.oracle-trait)

(define-constant MAX-STALENESS u600)

(define-data-var price-updater principal tx-sender)

(define-map price-feeds
  (string-ascii 12)
  {
    price: uint,
    confidence: uint,
    timestamp: uint,
    block-height: uint
  }
)

(define-public (update-price
    (asset-id (string-ascii 12))
    (price uint)
    (confidence uint)
    (timestamp uint))
  (begin
    (asserts! (or
      (is-eq tx-sender (var-get price-updater))
      (contract-call? .onloan-core-v2 is-authorized tx-sender))
      (err u1000))
    (asserts! (> price u0) (err u1003))
    (asserts! (> confidence u0) (err u1003))
    (map-set price-feeds asset-id {
      price: price,
      confidence: confidence,
      timestamp: timestamp,
      block-height: stacks-block-height
    })
    (print {event: "price-update", asset-id: asset-id, price: price, confidence: confidence, timestamp: timestamp})
    (ok true)
  )
)

(define-public (set-price-updater (new-updater principal))
  (begin
    (asserts! (is-eq tx-sender (contract-call? .onloan-core-v2 get-owner)) (err u1000))
    (var-set price-updater new-updater)
    (ok true)
  )
)

(define-read-only (get-price (asset-id (string-ascii 12)))
  (let (
    (feed (unwrap! (map-get? price-feeds asset-id) (err u1002)))
  )
    (asserts! (<= (- stacks-block-height (get block-height feed)) MAX-STALENESS) (err u1009))
    (asserts! (>= (get confidence feed) u100) (err u1010))
    (ok {
      price: (get price feed),
      confidence: (get confidence feed),
      timestamp: (get timestamp feed)
    })
  )
)

(define-read-only (is-price-valid (asset-id (string-ascii 12)))
  (match (map-get? price-feeds asset-id)
    feed (ok (and
      (<= (- stacks-block-height (get block-height feed)) MAX-STALENESS)
      (>= (get confidence feed) u100)))
    (ok false)
  )
)

(define-read-only (get-raw-price (asset-id (string-ascii 12)))
  (map-get? price-feeds asset-id)
)
