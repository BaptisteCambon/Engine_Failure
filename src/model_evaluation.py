import numpy as np
from sklearn.metrics import mean_squared_error

def cmapss_score(y_true, y_pred):
    """
    Official NASA CMAPSS asymmetric scoring function.
    Penalizes late predictions more than early ones.
    """
    d = y_pred - y_true
    scores = np.where(d < 0, np.exp(-d / 13) - 1, np.exp(d / 10) - 1)
    return np.sum(scores)

def evaluate(y_true, y_pred, label=""):
    """
    Evaluate the model's performance using RMSE and the NASA CMAPSS scoring function.
    """
    rmse = np.sqrt(mean_squared_error(y_true, y_pred))
    score = cmapss_score(y_true.values, y_pred)
    print(f"\n{'='*40}")
    if label:
        print(f"  {label}")
    print(f"  RMSE  : {rmse:.4f}")
    print(f"  Score : {score:.4f}")
    print(f"{'='*40}")
    return rmse, score