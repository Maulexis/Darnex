import pandas as pd

trains = pd.read_csv("src/db/train_movements.csv")

print(trains.head(20))
