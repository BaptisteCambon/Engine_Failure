import pandas as pd

def load_data(file_path):
    """
    Load NASA C-MAPSS dataset, compute Remaining Useful Life (RUL) for each unit, and return a clean dataframe.
    """
    
    # 1 - Read file and assign column names
    df = pd.read_csv(file_path, sep="\s+", header=None)
    df.columns = ["unit", "cycle"] + [f"op{j}" for j in range(1, 4)] + [f"s{i}" for i in range(1, 22)]

    # 2 - Find the maximum cycle for each unit
    max_cycle = df.groupby("unit")["cycle"].max().reset_index()
    max_cycle.columns = ["unit", "max_cycle"]

    # 3 - Compute RUL by merging the max_cycle back to the original dataframe
    df = df.merge(max_cycle, on="unit")
    df["RUL"] = df["max_cycle"] - df["cycle"]

    # 4 - Drop the max_cycle column as it's no longer needed
    df.drop(columns=["max_cycle"], inplace=True)

    # 5 - Return a clean dataframe
    return df