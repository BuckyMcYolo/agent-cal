// Helper function to convert day names to integers
export const dayToInteger = (day: string) => {
  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }
  return dayMap[day.toLowerCase()]
}
