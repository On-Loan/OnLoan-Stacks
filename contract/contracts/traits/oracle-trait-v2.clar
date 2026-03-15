(define-trait oracle-trait
  (
    (get-price ((string-ascii 12)) (response {price: uint, confidence: uint, timestamp: uint} uint))
    (is-price-valid ((string-ascii 12)) (response bool uint))
  )
)
