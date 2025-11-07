using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.My;
using IncliGraph_V1._1_Pro.My.Resources;
using Microsoft.VisualBasic;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class Exportar : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	[CompilerGenerated]
	[AccessedThroughProperty("CheckBox12")]
	private CheckBox _CheckBox12;

	private string ruta;

	[field: AccessedThroughProperty("GroupBox1")]
	internal virtual GroupBox GroupBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual Button Button1
	{
		[CompilerGenerated]
		get
		{
			return _Button1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button1_Click;
			Button button = _Button1;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button1 = value;
			button = _Button1;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	internal virtual Button Button2
	{
		[CompilerGenerated]
		get
		{
			return _Button2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = Button2_Click;
			Button button = _Button2;
			if (button != null)
			{
				button.Click -= value2;
			}
			_Button2 = value;
			button = _Button2;
			if (button != null)
			{
				button.Click += value2;
			}
		}
	}

	[field: AccessedThroughProperty("CheckBox7")]
	internal virtual CheckBox CheckBox7
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox6")]
	internal virtual CheckBox CheckBox6
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox5")]
	internal virtual CheckBox CheckBox5
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox4")]
	internal virtual CheckBox CheckBox4
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox3")]
	internal virtual CheckBox CheckBox3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox2")]
	internal virtual CheckBox CheckBox2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox1")]
	internal virtual CheckBox CheckBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox10")]
	internal virtual CheckBox CheckBox10
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox9")]
	internal virtual CheckBox CheckBox9
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox2")]
	internal virtual GroupBox GroupBox2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox8")]
	internal virtual CheckBox CheckBox8
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox11")]
	internal virtual CheckBox CheckBox11
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual CheckBox CheckBox12
	{
		[CompilerGenerated]
		get
		{
			return _CheckBox12;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			EventHandler value2 = CheckBox12_CheckedChanged;
			CheckBox checkBox = _CheckBox12;
			if (checkBox != null)
			{
				checkBox.CheckedChanged -= value2;
			}
			_CheckBox12 = value;
			checkBox = _CheckBox12;
			if (checkBox != null)
			{
				checkBox.CheckedChanged += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label1")]
	internal virtual Label Label1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Panel1")]
	internal virtual Panel Panel1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("RadioButton2")]
	internal virtual RadioButton RadioButton2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("RadioButton1")]
	internal virtual RadioButton RadioButton1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox13")]
	internal virtual CheckBox CheckBox13
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("CheckBox14")]
	internal virtual CheckBox CheckBox14
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	public Exportar()
	{
		base.Load += Exportar_Load;
		InitializeComponent();
	}

	[DebuggerNonUserCode]
	protected override void Dispose(bool disposing)
	{
		try
		{
			if (disposing && components != null)
			{
				components.Dispose();
			}
		}
		finally
		{
			base.Dispose(disposing);
		}
	}

	[System.Diagnostics.DebuggerStepThrough]
	private void InitializeComponent()
	{
		this.GroupBox1 = new System.Windows.Forms.GroupBox();
		this.CheckBox11 = new System.Windows.Forms.CheckBox();
		this.CheckBox10 = new System.Windows.Forms.CheckBox();
		this.CheckBox8 = new System.Windows.Forms.CheckBox();
		this.CheckBox9 = new System.Windows.Forms.CheckBox();
		this.CheckBox3 = new System.Windows.Forms.CheckBox();
		this.CheckBox4 = new System.Windows.Forms.CheckBox();
		this.CheckBox7 = new System.Windows.Forms.CheckBox();
		this.CheckBox14 = new System.Windows.Forms.CheckBox();
		this.CheckBox13 = new System.Windows.Forms.CheckBox();
		this.CheckBox6 = new System.Windows.Forms.CheckBox();
		this.CheckBox2 = new System.Windows.Forms.CheckBox();
		this.CheckBox5 = new System.Windows.Forms.CheckBox();
		this.CheckBox12 = new System.Windows.Forms.CheckBox();
		this.CheckBox1 = new System.Windows.Forms.CheckBox();
		this.GroupBox2 = new System.Windows.Forms.GroupBox();
		this.RadioButton2 = new System.Windows.Forms.RadioButton();
		this.RadioButton1 = new System.Windows.Forms.RadioButton();
		this.Button1 = new System.Windows.Forms.Button();
		this.Button2 = new System.Windows.Forms.Button();
		this.Label1 = new System.Windows.Forms.Label();
		this.Panel1 = new System.Windows.Forms.Panel();
		this.GroupBox1.SuspendLayout();
		this.GroupBox2.SuspendLayout();
		this.Panel1.SuspendLayout();
		base.SuspendLayout();
		this.GroupBox1.Controls.Add(this.CheckBox10);
		this.GroupBox1.Controls.Add(this.CheckBox8);
		this.GroupBox1.Controls.Add(this.CheckBox9);
		this.GroupBox1.Controls.Add(this.CheckBox3);
		this.GroupBox1.Controls.Add(this.CheckBox4);
		this.GroupBox1.Controls.Add(this.CheckBox7);
		this.GroupBox1.Controls.Add(this.CheckBox14);
		this.GroupBox1.Controls.Add(this.CheckBox13);
		this.GroupBox1.Controls.Add(this.CheckBox6);
		this.GroupBox1.Controls.Add(this.CheckBox2);
		this.GroupBox1.Controls.Add(this.CheckBox5);
		this.GroupBox1.Controls.Add(this.CheckBox12);
		this.GroupBox1.Controls.Add(this.CheckBox1);
		this.GroupBox1.Location = new System.Drawing.Point(12, 12);
		this.GroupBox1.Name = "GroupBox1";
		this.GroupBox1.Size = new System.Drawing.Size(269, 360);
		this.GroupBox1.TabIndex = 0;
		this.GroupBox1.TabStop = false;
		this.GroupBox1.Text = "Indique los elementos que desea exportar a Excel";
		this.CheckBox11.AutoSize = true;
		this.CheckBox11.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox11.Location = new System.Drawing.Point(227, 204);
		this.CheckBox11.Name = "CheckBox11";
		this.CheckBox11.Size = new System.Drawing.Size(211, 18);
		this.CheckBox11.TabIndex = 6;
		this.CheckBox11.Text = "Posición Selector configuración (1 - 2)";
		this.CheckBox11.UseVisualStyleBackColor = true;
		this.CheckBox11.Visible = false;
		this.CheckBox10.AutoSize = true;
		this.CheckBox10.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox10.Location = new System.Drawing.Point(5, 166);
		this.CheckBox10.Name = "CheckBox10";
		this.CheckBox10.Size = new System.Drawing.Size(100, 18);
		this.CheckBox10.TabIndex = 6;
		this.CheckBox10.Text = "Nivel de Alarma";
		this.CheckBox10.UseVisualStyleBackColor = true;
		this.CheckBox8.AutoSize = true;
		this.CheckBox8.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox8.Location = new System.Drawing.Point(5, 118);
		this.CheckBox8.Name = "CheckBox8";
		this.CheckBox8.Size = new System.Drawing.Size(165, 18);
		this.CheckBox8.TabIndex = 6;
		this.CheckBox8.Text = "Velocidad del Vehículo [km/h]";
		this.CheckBox8.UseVisualStyleBackColor = true;
		this.CheckBox9.AutoSize = true;
		this.CheckBox9.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox9.Location = new System.Drawing.Point(5, 142);
		this.CheckBox9.Name = "CheckBox9";
		this.CheckBox9.Size = new System.Drawing.Size(69, 18);
		this.CheckBox9.TabIndex = 5;
		this.CheckBox9.Text = "Giro [º/s]";
		this.CheckBox9.UseVisualStyleBackColor = true;
		this.CheckBox3.AutoSize = true;
		this.CheckBox3.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox3.Location = new System.Drawing.Point(5, 190);
		this.CheckBox3.Name = "CheckBox3";
		this.CheckBox3.Size = new System.Drawing.Size(167, 18);
		this.CheckBox3.TabIndex = 1;
		this.CheckBox3.Text = "Velocidad angular alabeo[º/s]";
		this.CheckBox3.UseVisualStyleBackColor = true;
		this.CheckBox4.AutoSize = true;
		this.CheckBox4.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox4.Location = new System.Drawing.Point(5, 214);
		this.CheckBox4.Name = "CheckBox4";
		this.CheckBox4.Size = new System.Drawing.Size(180, 18);
		this.CheckBox4.TabIndex = 2;
		this.CheckBox4.Text = "Velocidad angular cabeceo [º/s]";
		this.CheckBox4.UseVisualStyleBackColor = true;
		this.CheckBox7.AutoSize = true;
		this.CheckBox7.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox7.Location = new System.Drawing.Point(5, 94);
		this.CheckBox7.Name = "CheckBox7";
		this.CheckBox7.Size = new System.Drawing.Size(132, 18);
		this.CheckBox7.TabIndex = 5;
		this.CheckBox7.Text = "Estabilidad Lateral [%]";
		this.CheckBox7.UseVisualStyleBackColor = true;
		this.CheckBox14.AutoSize = true;
		this.CheckBox14.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox14.Location = new System.Drawing.Point(4, 310);
		this.CheckBox14.Name = "CheckBox14";
		this.CheckBox14.Size = new System.Drawing.Size(179, 18);
		this.CheckBox14.TabIndex = 8;
		this.CheckBox14.Text = "Estabilidad Lateral sin Filtrar [%]";
		this.CheckBox14.UseVisualStyleBackColor = true;
		this.CheckBox13.AutoSize = true;
		this.CheckBox13.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox13.Location = new System.Drawing.Point(4, 286);
		this.CheckBox13.Name = "CheckBox13";
		this.CheckBox13.Size = new System.Drawing.Size(213, 18);
		this.CheckBox13.TabIndex = 8;
		this.CheckBox13.Text = "Velocidad angular alabeo sin Filtrar [%]";
		this.CheckBox13.UseVisualStyleBackColor = true;
		this.CheckBox6.AutoSize = true;
		this.CheckBox6.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox6.Location = new System.Drawing.Point(5, 262);
		this.CheckBox6.Name = "CheckBox6";
		this.CheckBox6.Size = new System.Drawing.Size(173, 18);
		this.CheckBox6.TabIndex = 8;
		this.CheckBox6.Text = "Inclinación Lateral sin Filtrar [º]";
		this.CheckBox6.UseVisualStyleBackColor = true;
		this.CheckBox2.AutoSize = true;
		this.CheckBox2.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox2.Location = new System.Drawing.Point(6, 70);
		this.CheckBox2.Name = "CheckBox2";
		this.CheckBox2.Size = new System.Drawing.Size(126, 18);
		this.CheckBox2.TabIndex = 4;
		this.CheckBox2.Text = "Inclinación Frontal [º]";
		this.CheckBox2.UseVisualStyleBackColor = true;
		this.CheckBox5.AutoSize = true;
		this.CheckBox5.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox5.Location = new System.Drawing.Point(5, 238);
		this.CheckBox5.Name = "CheckBox5";
		this.CheckBox5.Size = new System.Drawing.Size(233, 18);
		this.CheckBox5.TabIndex = 7;
		this.CheckBox5.Text = "Velocidad Crítica de Inclinación Lateral [º/s]";
		this.CheckBox5.UseVisualStyleBackColor = true;
		this.CheckBox12.AutoSize = true;
		this.CheckBox12.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox12.Location = new System.Drawing.Point(6, 25);
		this.CheckBox12.Name = "CheckBox12";
		this.CheckBox12.Size = new System.Drawing.Size(49, 18);
		this.CheckBox12.TabIndex = 3;
		this.CheckBox12.Text = "Hora";
		this.CheckBox12.UseVisualStyleBackColor = true;
		this.CheckBox1.AutoSize = true;
		this.CheckBox1.Font = new System.Drawing.Font("Arial", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.CheckBox1.Location = new System.Drawing.Point(6, 46);
		this.CheckBox1.Name = "CheckBox1";
		this.CheckBox1.Size = new System.Drawing.Size(126, 18);
		this.CheckBox1.TabIndex = 3;
		this.CheckBox1.Text = "Inclinación Lateral [º]";
		this.CheckBox1.UseVisualStyleBackColor = true;
		this.GroupBox2.Controls.Add(this.RadioButton2);
		this.GroupBox2.Controls.Add(this.RadioButton1);
		this.GroupBox2.Location = new System.Drawing.Point(11, 378);
		this.GroupBox2.Name = "GroupBox2";
		this.GroupBox2.Size = new System.Drawing.Size(269, 61);
		this.GroupBox2.TabIndex = 9;
		this.GroupBox2.TabStop = false;
		this.GroupBox2.Text = "Intervalo de Tiempo a Exportar";
		this.RadioButton2.AutoSize = true;
		this.RadioButton2.Location = new System.Drawing.Point(6, 38);
		this.RadioButton2.Name = "RadioButton2";
		this.RadioButton2.Size = new System.Drawing.Size(175, 17);
		this.RadioButton2.TabIndex = 3;
		this.RadioButton2.TabStop = true;
		this.RadioButton2.Text = "Intervalo mostrado en la Gráfica";
		this.RadioButton2.UseVisualStyleBackColor = true;
		this.RadioButton1.AutoSize = true;
		this.RadioButton1.Location = new System.Drawing.Point(6, 19);
		this.RadioButton1.Name = "RadioButton1";
		this.RadioButton1.Size = new System.Drawing.Size(140, 17);
		this.RadioButton1.TabIndex = 3;
		this.RadioButton1.TabStop = true;
		this.RadioButton1.Text = "Todo el Tramo de Turno";
		this.RadioButton1.UseVisualStyleBackColor = true;
		this.Button1.Location = new System.Drawing.Point(172, 3);
		this.Button1.Name = "Button1";
		this.Button1.Size = new System.Drawing.Size(100, 25);
		this.Button1.TabIndex = 1;
		this.Button1.Text = "Exportar";
		this.Button1.UseVisualStyleBackColor = true;
		this.Button2.Location = new System.Drawing.Point(3, 3);
		this.Button2.Name = "Button2";
		this.Button2.Size = new System.Drawing.Size(100, 25);
		this.Button2.TabIndex = 1;
		this.Button2.Text = "Cancelar";
		this.Button2.UseVisualStyleBackColor = true;
		this.Label1.AutoSize = true;
		this.Label1.Location = new System.Drawing.Point(0, 31);
		this.Label1.Name = "Label1";
		this.Label1.Size = new System.Drawing.Size(272, 13);
		this.Label1.TabIndex = 10;
		this.Label1.Text = "Nota: El archivo generado se encuentra en formato .csv";
		this.Panel1.Controls.Add(this.Button2);
		this.Panel1.Controls.Add(this.Label1);
		this.Panel1.Controls.Add(this.Button1);
		this.Panel1.Location = new System.Drawing.Point(11, 445);
		this.Panel1.Name = "Panel1";
		this.Panel1.Size = new System.Drawing.Size(277, 54);
		this.Panel1.TabIndex = 11;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 13f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(298, 526);
		base.Controls.Add(this.CheckBox11);
		base.Controls.Add(this.Panel1);
		base.Controls.Add(this.GroupBox2);
		base.Controls.Add(this.GroupBox1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Fixed3D;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "Exportar";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "Exportar";
		this.GroupBox1.ResumeLayout(false);
		this.GroupBox1.PerformLayout();
		this.GroupBox2.ResumeLayout(false);
		this.GroupBox2.PerformLayout();
		this.Panel1.ResumeLayout(false);
		this.Panel1.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void Exportar_Load(object sender, EventArgs e)
	{
		GroupBox1.Text = frases.ResourceManager.GetString("indique");
		GroupBox2.Text = frases.ResourceManager.GetString("intervalo");
		RadioButton1.Text = frases.ResourceManager.GetString("todoeltramodeturno");
		RadioButton2.Text = frases.ResourceManager.GetString("intervalomostradoenlagrafica");
		Text = frases.ResourceManager.GetString("exportar");
		Button1.Text = frases.ResourceManager.GetString("exportar");
		Button2.Text = frases.ResourceManager.GetString("cancelar");
		CheckBox1.Checked = true;
		CheckBox1.Text = frases.ResourceManager.GetString("inclinacionlateral");
		CheckBox2.Checked = true;
		CheckBox2.Text = frases.ResourceManager.GetString("inclinacionfrontal");
		CheckBox7.Checked = true;
		CheckBox7.Text = frases.ResourceManager.GetString("estabilidadlateral");
		CheckBox12.Checked = true;
		CheckBox12.Text = frases.ResourceManager.GetString("hora");
		Label1.Text = frases.ResourceManager.GetString("archivoescsv");
		CheckBox7.Checked = true;
		CheckBox8.Checked = true;
		CheckBox8.Text = frases.ResourceManager.GetString("velocidad");
		CheckBox9.Checked = true;
		CheckBox9.Text = frases.ResourceManager.GetString("giro");
		CheckBox10.Checked = true;
		CheckBox10.Text = frases.ResourceManager.GetString("nivelesdealarma");
		CheckBox11.Checked = true;
		RadioButton1.Checked = true;
		CheckBox3.Text = frases.ResourceManager.GetString("AA");
		CheckBox4.Text = frases.ResourceManager.GetString("AC");
		CheckBox5.Text = frases.ResourceManager.GetString("VCIL");
		CheckBox6.Text = frases.ResourceManager.GetString("ILRAW");
		CheckBox13.Text = frases.ResourceManager.GetString("AARAW");
		CheckBox14.Text = frases.ResourceManager.GetString("ELRAW");
		checked
		{
			if (MyProject.Forms.Principal.user == 2)
			{
				CheckBox3.Visible = false;
				CheckBox4.Visible = false;
				CheckBox5.Visible = false;
				CheckBox6.Visible = false;
				CheckBox13.Visible = false;
				CheckBox14.Visible = false;
				GroupBox1.Height = 213;
				GroupBox2.Location = new Point(GroupBox1.Location.X, GroupBox1.Location.Y + GroupBox1.Height + 3);
				Panel1.Location = new Point(GroupBox2.Location.X, GroupBox2.Location.Y + GroupBox2.Height + 3);
				base.Height = Panel1.Location.Y + Panel1.Height + 30;
			}
		}
	}

	private void Button2_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		SaveFileDialog saveFileDialog = new SaveFileDialog();
		saveFileDialog.InitialDirectory = Conversions.ToString(0);
		saveFileDialog.Title = "Exportar datos a CSV";
		saveFileDialog.Filter = "csv files (*.csv)|*.csv|All files (*.*)|*.*";
		saveFileDialog.DefaultExt = "csv";
		saveFileDialog.AddExtension = true;
		saveFileDialog.OverwritePrompt = false;
		if (saveFileDialog.ShowDialog() != DialogResult.OK)
		{
			return;
		}
		ruta = saveFileDialog.FileName;
		if (File.Exists(ruta))
		{
			MsgBoxStyle buttons = MsgBoxStyle.YesNo;
			string title = "Advertencia";
			if (Interaction.MsgBox("El archivo ya existe. ¿Desea sobreescribir el archivo?", buttons, title) == MsgBoxResult.Yes)
			{
				File.Delete(ruta);
				rutina_exportacion();
				Close();
			}
		}
		else
		{
			rutina_exportacion();
			Close();
		}
	}

	private void rutina_exportacion()
	{
		MyProject.Forms.barra.Show();
		MyProject.Forms.barra.Label1.Text = "Exportando datos, por favor, espere.....";
		MyProject.Forms.barra.ProgressBar1.Value = 0;
		MyProject.Forms.barra.Update();
		File.Create(ruta).Close();
		string text = "";
		text += " ;";
		if (CheckBox12.Checked)
		{
			text += "Hora;";
		}
		if (CheckBox1.Checked)
		{
			text += "Inclinacion lateral [grados];";
		}
		if (CheckBox2.Checked)
		{
			text += "Inclinacion frontal [grados];";
		}
		if (CheckBox7.Checked)
		{
			text += "Estabilidad lateral [%];";
		}
		if (CheckBox8.Checked)
		{
			text += "Velocidad [km/h];";
		}
		if (CheckBox9.Checked)
		{
			text += "Giro [grados/s];";
		}
		if (CheckBox10.Checked)
		{
			text += "Nivel Alarma;";
		}
		if (CheckBox11.Checked)
		{
			text += "Posicion Selector;";
		}
		if (CheckBox3.Checked)
		{
			text += "Vel. angular inclinacion lateral [grados/s];";
		}
		if (CheckBox4.Checked)
		{
			text += "Vel. angular inclinacion frontal [grados/s];";
		}
		if (CheckBox5.Checked)
		{
			text += "Vel. angular critica inclinacion lateral [grados/s];";
		}
		if (CheckBox6.Checked)
		{
			text += "Inclinacion lateral sin filtrar [grados];";
		}
		if (CheckBox13.Checked)
		{
			text += "Vel. angular cabeceo sin filtrar [grados/s];";
		}
		if (CheckBox14.Checked)
		{
			text += "Estabilidad lateral sin filtrar [%];";
		}
		using (StreamWriter streamWriter = new StreamWriter(ruta, append: true))
		{
			streamWriter.WriteLine(text);
			streamWriter.Close();
		}
		checked
		{
			int num;
			int num2;
			if (RadioButton1.Checked)
			{
				num = 1;
				num2 = MyProject.Forms.Form1.NUMEROREGISTROS - 1;
			}
			else
			{
				num = (int)Math.Round(MyProject.Forms.Form1.Xmin);
				num2 = (int)Math.Round(MyProject.Forms.Form1.Xmax);
			}
			int num3 = num;
			int num4 = num2;
			for (int i = num3; i <= num4; i++)
			{
				text = "";
				text = text + Conversions.ToString(i) + ";";
				if (CheckBox12.Checked)
				{
					text = text + MyProject.Forms.Form1.Hora[0, i - 1] + ";";
				}
				if (CheckBox1.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[23, i - 1]) + ";";
				}
				if (CheckBox2.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[2, i - 1]) + ";";
				}
				if (CheckBox7.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[11, i - 1]) + ";";
				}
				if (CheckBox8.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[14, i - 1]) + ";";
				}
				if (CheckBox9.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[8, i - 1]) + ";";
				}
				if (CheckBox10.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[13, i - 1]) + ";";
				}
				if (CheckBox11.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[17, i - 1] + 1f) + ";";
				}
				if (CheckBox3.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[20, i - 1]) + ";";
				}
				if (CheckBox4.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[6, i - 1]) + ";";
				}
				if (CheckBox5.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[10, i - 1]) + ";";
				}
				if (CheckBox6.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[1, i - 1]) + ";";
				}
				if (CheckBox13.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[7, i - 1]) + ";";
				}
				if (CheckBox14.Checked)
				{
					text = text + Conversions.ToString(MyProject.Forms.Form1.Registro[24, i - 1]) + ";";
				}
				MyProject.Forms.barra.ProgressBar1.Value = (int)Math.Floor((double)((i - num) * 100) / (double)(num2 - num));
				using StreamWriter streamWriter2 = new StreamWriter(ruta, append: true);
				streamWriter2.WriteLine(text);
				streamWriter2.Close();
			}
			MyProject.Forms.barra.Close();
		}
	}

	private void CheckBox12_CheckedChanged(object sender, EventArgs e)
	{
	}
}
