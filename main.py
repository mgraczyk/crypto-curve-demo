import numpy as np
from matplotlib import pyplot as plt


def original_function_float(x, A, n, D):
  n = x.shape[-1]
  sum_x = np.sum(x, axis=-1)
  prod_x = np.prod(x, axis=-1)

  nn = n**n
  Ann = A * nn

  Ann * sum_x + D = Ann * D + D**(n+1) / (nn * prod_x)

  4A * (x + y) + D = 4A * D + D^3 / (4 * x*y)


  Ann * sum_x = D * (Ann  - 1) + D**(n+1) / (nn * prod_x)
  D = (Ann * sum_x - D**(n+1) / (nn * prod_x)) / (Ann  - 1)


def linear_combination(x):
  y_prod = 1.0 / x
  y_linear = np.maximum(0.0, 2 - x)

  alpha * y_prod + (1 - alpha)


def main():
  # x1 = np.linspace(0.0, 100.0, 1000)
  # x2 = np.full_like(x1, 100.0)

  # x = np.column_stack((x1, x2))
  # A = 2.0

  # original_function_float(x, A, n)

  y = linear_combination(x, 0.5)
  plt.figure()
  
  plt.show()

if __name__ == "__main__":
  main()
