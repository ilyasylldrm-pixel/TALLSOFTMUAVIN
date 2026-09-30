import { FoodRecipe } from "../types";
import { soupRecipes } from "./recipes/soupRecipes";
import { meatRecipes } from "./recipes/meatRecipes";
import { vegRecipes } from "./recipes/vegRecipes";
import { sideRecipes } from "./recipes/sideRecipes";
import { saladRecipes } from "./recipes/saladRecipes";
import { dessertRecipes } from "./recipes/dessertRecipes";
import { beverageRecipes } from "./recipes/beverageRecipes";
import { breakfastRecipes } from "./recipes/breakfastRecipes";

export const initialFoodRecipes: FoodRecipe[] = [
  ...breakfastRecipes,
  ...soupRecipes,
  ...meatRecipes,
  ...vegRecipes,
  ...sideRecipes,
  ...saladRecipes,
  ...dessertRecipes,
  ...beverageRecipes,
];

export {
  breakfastRecipes,
  soupRecipes,
  meatRecipes,
  vegRecipes,
  sideRecipes,
  saladRecipes,
  dessertRecipes,
  beverageRecipes,
};
