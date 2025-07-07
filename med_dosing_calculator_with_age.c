#include <stdio.h>
#include <math.h>
#include <string.h>

int main() {
    double height_cm, height_m, weight_kg, TBW, IBW, LBW, FFM, BMI;
    int age;
    char sex[10];

    printf("Enter patient sex (male/female): ");
    scanf("%s", sex);
    
    printf("Enter age in years: ");
    scanf("%d", &age);

    printf("Enter height in cm: ");
    scanf("%lf", &height_cm);
    
    printf("Enter weight in kg: ");
    scanf("%lf", &weight_kg);

    height_m = height_cm / 100.0;
    TBW = weight_kg;
    BMI = TBW / (height_m * height_m);

    // Calculate IBW
    if (strcmp(sex, "male") == 0) {
        IBW = 50.0 + 0.91 * (height_cm - 152.4);
    } else {
        IBW = 45.5 + 0.91 * (height_cm - 152.4);
    }

    // Calculate LBW
    if (strcmp(sex, "male") == 0) {
        LBW = (1.10 * TBW) - 128 * (TBW / (height_m * 100) / (height_m * 100));
    } else {
        LBW = (1.07 * TBW) - 148 * (TBW / (height_m * 100) / (height_m * 100));
    }

    // Calculate FFM
    if (strcmp(sex, "male") == 0) {
        FFM = (9270 * TBW) / (668 + 216 * BMI);
    } else {
        FFM = (9270 * TBW) / (878 + 244 * BMI);
    }

    printf("\n--- Patient Metrics ---\n");
    printf("Age: %d years\n", age);
    printf("Height: %.2f cm (%.2f m)\n", height_cm, height_m);
    printf("Weight (TBW): %.2f kg\n", TBW);
    printf("BMI: %.2f kg/m^2\n", BMI);
    printf("Ideal Body Weight (IBW): %.2f kg\n", IBW);
    printf("Lean Body Weight (LBW): %.2f kg\n", LBW);
    printf("Fat-Free Mass (FFM): %.2f kg\n", FFM);

    printf("\n--- Medication Dosing ---\n");

    // Succinylcholine
    printf("Succinylcholine Dose (1 mg/kg TBW): %.2f mg\n", TBW * 1.0);

    // Rocuronium
    printf("Rocuronium Dose (0.6 mg/kg LBW): %.2f mg\n", LBW * 0.6);

    // Cisatracurium
    printf("Cisatracurium Dose (0.15 mg/kg LBW): %.2f mg\n", LBW * 0.15);

    // Fentanyl
    printf("Fentanyl Induction Dose (2 mcg/kg TBW): %.2f mcg\n", TBW * 2.0);
    printf("Fentanyl Maintenance Dose (1 mcg/kg IBW): %.2f mcg\n", IBW * 1.0);

    // Remifentanil
    double remi_dose_base = 0.1;  // mcg/kg/min
    double age_factor_remi = 1.0;

    if (age >= 80)
        age_factor_remi = 0.30;  // 70% reduction
    else if (age >= 65)
        age_factor_remi = 0.50;
    else if (age < 1)
        age_factor_remi = 1.50;

    double remi_LBW_dose = LBW * remi_dose_base * age_factor_remi;
    double remi_FFM_dose = FFM * remi_dose_base * age_factor_remi;

    printf("Remifentanil Infusion (LBW, age-adjusted): %.2f mcg/min\n", remi_LBW_dose);
    if (BMI > 39) {
        printf("Remifentanil (BMI>39) Infusion (FFM, age-adjusted): %.2f mcg/min\n", remi_FFM_dose);
    }

    // Propofol
    double propofol_induction_dose = LBW * 2.0;
    double propofol_maintenance = TBW * 100.0; // mcg/min

    if (age > 65) {
        propofol_induction_dose *= 0.75; // Reduce dose for elderly
        propofol_maintenance *= 0.75;
    }

    printf("Propofol Induction (2 mg/kg LBW, age-adjusted): %.2f mg\n", propofol_induction_dose);
    printf("Propofol Maintenance (100 mcg/kg/min TBW, age-adjusted): %.2f mcg/min\n", propofol_maintenance);

    // Lidocaine
    double lidocaine_plain = TBW * 4.0;
    double lidocaine_epi = TBW * 7.0;
    if (lidocaine_plain > 300) lidocaine_plain = 300;
    if (lidocaine_epi > 500) lidocaine_epi = 500;
    printf("Max Lidocaine Dose (Plain): %.2f mg\n", lidocaine_plain);
    printf("Max Lidocaine Dose (With Epi): %.2f mg\n", lidocaine_epi);

    // Bupivacaine
    double bupi_plain = TBW * 2.0;
    double bupi_epi = TBW * 3.0;
    if (bupi_plain > 175) bupi_plain = 175;
    if (bupi_epi > 225) bupi_epi = 225;
    printf("Max Bupivacaine Dose (Plain): %.2f mg\n", bupi_plain);
    printf("Max Bupivacaine Dose (With Epi): %.2f mg\n", bupi_epi);

    // Epinephrine
    printf("Max Safe Epinephrine Dose (0.07 mg/kg): %.2f mg\n", TBW * 0.07);

    // Ketamine
    double ketamine_iv = TBW * 1.5;
    double ketamine_sub = TBW * 0.35;

    if (age > 65) {
        ketamine_iv *= 0.75;
        ketamine_sub *= 0.75;
    }

    printf("Ketamine IV Induction (1.5 mg/kg, age-adjusted): %.2f mg\n", ketamine_iv);
    printf("Ketamine Subanesthetic Bolus (0.35 mg/kg, age-adjusted): %.2f mg\n", ketamine_sub);

    return 0;
}