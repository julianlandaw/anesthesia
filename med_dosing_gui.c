#include <gtk/gtk.h>
#include <math.h>
#include <string.h>
#include <stdio.h>

GtkWidget *output_view;

void calculate_dosing(GtkWidget *widget, gpointer data) {
    const gchar *sex = gtk_entry_get_text(GTK_ENTRY(((GtkWidget **)data)[0]));
    const gchar *age_str = gtk_entry_get_text(GTK_ENTRY(((GtkWidget **)data)[1]));
    const gchar *height_str = gtk_entry_get_text(GTK_ENTRY(((GtkWidget **)data)[2]));
    const gchar *weight_str = gtk_entry_get_text(GTK_ENTRY(((GtkWidget **)data)[3]));

    int age = atoi(age_str);
    double height_cm = atof(height_str);
    double weight_kg = atof(weight_str);
    double height_m = height_cm / 100.0;
    double TBW = weight_kg;
    double BMI = TBW / (height_m * height_m);
    double IBW, LBW, FFM;

    if (g_ascii_strcasecmp(sex, "male") == 0)
        IBW = 50.0 + 0.91 * (height_cm - 152.4);
    else
        IBW = 45.5 + 0.91 * (height_cm - 152.4);

    if (g_ascii_strcasecmp(sex, "male") == 0)
        LBW = (1.10 * TBW) - 128 * (TBW / (height_m * 100) / (height_m * 100));
    else
        LBW = (1.07 * TBW) - 148 * (TBW / (height_m * 100) / (height_m * 100));

    if (g_ascii_strcasecmp(sex, "male") == 0)
        FFM = (9270 * TBW) / (668 + 216 * BMI);
    else
        FFM = (9270 * TBW) / (878 + 244 * BMI);

    double age_factor_remi = (age >= 80) ? 0.3 : (age >= 65) ? 0.5 : (age < 1) ? 1.5 : 1.0;

    char buffer[8192];
    snprintf(buffer, sizeof(buffer),
        "--- Patient Metrics ---\n"
        "Sex: %s\nAge: %d years\nHeight: %.2f cm\nWeight: %.2f kg\n"
        "BMI: %.2f kg/m^2\nIBW: %.2f kg\nLBW: %.2f kg\nFFM: %.2f kg\n\n"
        "--- Dosing ---\n"
        "Succinylcholine (1 mg/kg TBW): %.2f mg\n"
        "Rocuronium (0.6 mg/kg LBW): %.2f mg\n"
        "Cisatracurium (0.15 mg/kg LBW): %.2f mg\n"
        "Fentanyl Induction (2 mcg/kg TBW): %.2f mcg\n"
        "Fentanyl Maintenance (1 mcg/kg IBW): %.2f mcg\n"
        "Remifentanil (LBW, age-adjusted): %.2f mcg/min\n"
        "%s"
        "Propofol Induction (2 mg/kg LBW, adj): %.2f mg\n"
        "Propofol Maintenance (100 mcg/kg/min TBW, adj): %.2f mcg/min\n"
        "Lidocaine Max (Plain, 4 mg/kg): %.2f mg\n"
        "Lidocaine Max (Epi, 7 mg/kg): %.2f mg\n"
        "Bupivacaine Max (Plain, 2 mg/kg): %.2f mg\n"
        "Bupivacaine Max (Epi, 3 mg/kg): %.2f mg\n"
        "Epinephrine Max (0.07 mg/kg): %.2f mg\n"
        "Ketamine IV (1.5 mg/kg, adj): %.2f mg\n"
        "Ketamine Subanesthetic (0.35 mg/kg, adj): %.2f mg\n",
        sex, age, height_cm, TBW, BMI, IBW, LBW, FFM,
        TBW * 1.0,
        LBW * 0.6,
        LBW * 0.15,
        TBW * 2.0,
        IBW * 1.0,
        LBW * 0.1 * age_factor_remi,
        (BMI > 39) ? g_strdup_printf("Remifentanil (FFM, BMI>39): %.2f mcg/min\n", FFM * 0.1 * age_factor_remi) : "",
        (age > 65) ? LBW * 2.0 * 0.75 : LBW * 2.0,
        (age > 65) ? TBW * 100.0 * 0.75 : TBW * 100.0,
        fmin(TBW * 4.0, 300.0),
        fmin(TBW * 7.0, 500.0),
        fmin(TBW * 2.0, 175.0),
        fmin(TBW * 3.0, 225.0),
        TBW * 0.07,
        (age > 65) ? TBW * 1.5 * 0.75 : TBW * 1.5,
        (age > 65) ? TBW * 0.35 * 0.75 : TBW * 0.35
    );

    GtkTextBuffer *buffer_view = gtk_text_view_get_buffer(GTK_TEXT_VIEW(output_view));
    gtk_text_buffer_set_text(buffer_view, buffer, -1);
}

int main(int argc, char *argv[]) {
    gtk_init(&argc, &argv);

    GtkWidget *window = gtk_window_new(GTK_WINDOW_TOPLEVEL);
    gtk_window_set_title(GTK_WINDOW(window), "Medication Dosing Calculator");
    gtk_window_set_default_size(GTK_WINDOW(window), 600, 700);
    g_signal_connect(window, "destroy", G_CALLBACK(gtk_main_quit), NULL);

    GtkWidget *grid = gtk_grid_new();
    gtk_container_set_border_width(GTK_CONTAINER(grid), 10);
    gtk_grid_set_row_spacing(GTK_GRID(grid), 5);
    gtk_grid_set_column_spacing(GTK_GRID(grid), 5);

    GtkWidget *sex_entry = gtk_entry_new();
    GtkWidget *age_entry = gtk_entry_new();
    GtkWidget *height_entry = gtk_entry_new();
    GtkWidget *weight_entry = gtk_entry_new();

    gtk_grid_attach(GTK_GRID(grid), gtk_label_new("Sex (male/female):"), 0, 0, 1, 1);
    gtk_grid_attach(GTK_GRID(grid), sex_entry, 1, 0, 1, 1);
    gtk_grid_attach(GTK_GRID(grid), gtk_label_new("Age (years):"), 0, 1, 1, 1);
    gtk_grid_attach(GTK_GRID(grid), age_entry, 1, 1, 1, 1);
    gtk_grid_attach(GTK_GRID(grid), gtk_label_new("Height (cm):"), 0, 2, 1, 1);
    gtk_grid_attach(GTK_GRID(grid), height_entry, 1, 2, 1, 1);
    gtk_grid_attach(GTK_GRID(grid), gtk_label_new("Weight (kg):"), 0, 3, 1, 1);
    gtk_grid_attach(GTK_GRID(grid), weight_entry, 1, 3, 1, 1);

    GtkWidget *button = gtk_button_new_with_label("Calculate Dosages");
    gtk_grid_attach(GTK_GRID(grid), button, 0, 4, 2, 1);

    output_view = gtk_text_view_new();
    gtk_text_view_set_editable(GTK_TEXT_VIEW(output_view), FALSE);
    gtk_text_view_set_wrap_mode(GTK_TEXT_VIEW(output_view), GTK_WRAP_WORD_CHAR);

    GtkWidget *scrolled = gtk_scrolled_window_new(NULL, NULL);
    gtk_widget_set_vexpand(scrolled, TRUE);
    gtk_container_add(GTK_CONTAINER(scrolled), output_view);
    gtk_grid_attach(GTK_GRID(grid), scrolled, 0, 5, 2, 1);

    GtkWidget *container = gtk_box_new(GTK_ORIENTATION_VERTICAL, 5);
    gtk_container_add(GTK_CONTAINER(window), container);
    gtk_box_pack_start(GTK_BOX(container), grid, TRUE, TRUE, 0);

    GtkWidget *entries[] = { sex_entry, age_entry, height_entry, weight_entry };
    g_signal_connect(button, "clicked", G_CALLBACK(calculate_dosing), entries);

    gtk_widget_show_all(window);
    gtk_main();

    return 0;
}