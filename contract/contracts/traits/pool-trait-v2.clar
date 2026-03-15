(define-trait pool-trait
  (
    (deposit (uint (string-ascii 12) principal) (response uint uint))
    (withdraw (uint (string-ascii 12) principal) (response uint uint))
    (get-balance (principal (string-ascii 12)) (response uint uint))
    (get-pool-stats ((string-ascii 12)) (response {total-deposits: uint, total-borrows: uint} uint))
  )
)
