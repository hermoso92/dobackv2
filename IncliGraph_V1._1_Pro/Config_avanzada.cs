using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.My;
using IncliGraph_V1._1_Pro.My.Resources;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class Config_avanzada : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox1")]
	private TextBox _TextBox1;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox2")]
	private TextBox _TextBox2;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox3")]
	private TextBox _TextBox3;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox4")]
	private TextBox _TextBox4;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox8")]
	private TextBox _TextBox8;

	[CompilerGenerated]
	[AccessedThroughProperty("TextBox5")]
	private TextBox _TextBox5;

	private int aceptar;

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

	[field: AccessedThroughProperty("Label1")]
	internal virtual Label Label1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual TextBox TextBox1
	{
		[CompilerGenerated]
		get
		{
			return _TextBox1;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = TextBox1_KeyPress;
			TextBox textBox = _TextBox1;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_TextBox1 = value;
			textBox = _TextBox1;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label2")]
	internal virtual Label Label2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual TextBox TextBox2
	{
		[CompilerGenerated]
		get
		{
			return _TextBox2;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = TextBox2_KeyPress;
			TextBox textBox = _TextBox2;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_TextBox2 = value;
			textBox = _TextBox2;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label3")]
	internal virtual Label Label3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual TextBox TextBox3
	{
		[CompilerGenerated]
		get
		{
			return _TextBox3;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = TextBox3_KeyPress;
			TextBox textBox = _TextBox3;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_TextBox3 = value;
			textBox = _TextBox3;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label4")]
	internal virtual Label Label4
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual TextBox TextBox4
	{
		[CompilerGenerated]
		get
		{
			return _TextBox4;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = TextBox4_KeyPress;
			TextBox textBox = _TextBox4;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_TextBox4 = value;
			textBox = _TextBox4;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	[field: AccessedThroughProperty("TextBox6")]
	internal virtual TextBox TextBox6
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox7")]
	internal virtual TextBox TextBox7
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("PictureBox1")]
	internal virtual PictureBox PictureBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("GroupBox1")]
	internal virtual GroupBox GroupBox1
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

	internal virtual TextBox TextBox8
	{
		[CompilerGenerated]
		get
		{
			return _TextBox8;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = TextBox8_KeyPress;
			TextBox textBox = _TextBox8;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_TextBox8 = value;
			textBox = _TextBox8;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label6")]
	internal virtual Label Label6
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	internal virtual TextBox TextBox5
	{
		[CompilerGenerated]
		get
		{
			return _TextBox5;
		}
		[MethodImpl(MethodImplOptions.Synchronized)]
		[CompilerGenerated]
		set
		{
			KeyPressEventHandler value2 = TextBox5_KeyPress;
			TextBox textBox = _TextBox5;
			if (textBox != null)
			{
				textBox.KeyPress -= value2;
			}
			_TextBox5 = value;
			textBox = _TextBox5;
			if (textBox != null)
			{
				textBox.KeyPress += value2;
			}
		}
	}

	[field: AccessedThroughProperty("Label5")]
	internal virtual Label Label5
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox9")]
	internal virtual TextBox TextBox9
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	public Config_avanzada()
	{
		base.FormClosing += Config_avanzada_FormClosing;
		base.Load += Config_avanzada_Load;
		aceptar = 0;
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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(IncliGraph_V1._1_Pro.Config_avanzada));
		this.Button1 = new System.Windows.Forms.Button();
		this.Button2 = new System.Windows.Forms.Button();
		this.Label1 = new System.Windows.Forms.Label();
		this.TextBox1 = new System.Windows.Forms.TextBox();
		this.Label2 = new System.Windows.Forms.Label();
		this.TextBox2 = new System.Windows.Forms.TextBox();
		this.Label3 = new System.Windows.Forms.Label();
		this.TextBox3 = new System.Windows.Forms.TextBox();
		this.Label4 = new System.Windows.Forms.Label();
		this.TextBox4 = new System.Windows.Forms.TextBox();
		this.TextBox6 = new System.Windows.Forms.TextBox();
		this.TextBox7 = new System.Windows.Forms.TextBox();
		this.PictureBox1 = new System.Windows.Forms.PictureBox();
		this.GroupBox1 = new System.Windows.Forms.GroupBox();
		this.GroupBox2 = new System.Windows.Forms.GroupBox();
		this.TextBox9 = new System.Windows.Forms.TextBox();
		this.TextBox8 = new System.Windows.Forms.TextBox();
		this.Label6 = new System.Windows.Forms.Label();
		this.TextBox5 = new System.Windows.Forms.TextBox();
		this.Label5 = new System.Windows.Forms.Label();
		((System.ComponentModel.ISupportInitialize)this.PictureBox1).BeginInit();
		this.GroupBox1.SuspendLayout();
		this.GroupBox2.SuspendLayout();
		base.SuspendLayout();
		this.Button1.Location = new System.Drawing.Point(567, 290);
		this.Button1.Name = "Button1";
		this.Button1.Size = new System.Drawing.Size(75, 23);
		this.Button1.TabIndex = 0;
		this.Button1.Text = "Ok";
		this.Button1.UseVisualStyleBackColor = true;
		this.Button2.Location = new System.Drawing.Point(12, 290);
		this.Button2.Name = "Button2";
		this.Button2.Size = new System.Drawing.Size(75, 23);
		this.Button2.TabIndex = 0;
		this.Button2.Text = "Cancel";
		this.Button2.UseVisualStyleBackColor = true;
		this.Label1.AutoSize = true;
		this.Label1.Location = new System.Drawing.Point(116, 23);
		this.Label1.Name = "Label1";
		this.Label1.Size = new System.Drawing.Size(22, 13);
		this.Label1.TabIndex = 0;
		this.Label1.Text = "T1";
		this.TextBox1.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.TextBox1.Location = new System.Drawing.Point(144, 20);
		this.TextBox1.Name = "TextBox1";
		this.TextBox1.Size = new System.Drawing.Size(57, 20);
		this.TextBox1.TabIndex = 1;
		this.Label2.AutoSize = true;
		this.Label2.Location = new System.Drawing.Point(217, 23);
		this.Label2.Name = "Label2";
		this.Label2.Size = new System.Drawing.Size(22, 13);
		this.Label2.TabIndex = 0;
		this.Label2.Text = "T2";
		this.TextBox2.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.TextBox2.Location = new System.Drawing.Point(245, 20);
		this.TextBox2.Name = "TextBox2";
		this.TextBox2.Size = new System.Drawing.Size(57, 20);
		this.TextBox2.TabIndex = 1;
		this.Label3.AutoSize = true;
		this.Label3.Location = new System.Drawing.Point(323, 23);
		this.Label3.Name = "Label3";
		this.Label3.Size = new System.Drawing.Size(22, 13);
		this.Label3.TabIndex = 0;
		this.Label3.Text = "T3";
		this.TextBox3.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.TextBox3.Location = new System.Drawing.Point(351, 20);
		this.TextBox3.Name = "TextBox3";
		this.TextBox3.Size = new System.Drawing.Size(57, 20);
		this.TextBox3.TabIndex = 1;
		this.Label4.AutoSize = true;
		this.Label4.Location = new System.Drawing.Point(430, 23);
		this.Label4.Name = "Label4";
		this.Label4.Size = new System.Drawing.Size(22, 13);
		this.Label4.TabIndex = 0;
		this.Label4.Text = "T4";
		this.TextBox4.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.TextBox4.Location = new System.Drawing.Point(458, 20);
		this.TextBox4.Name = "TextBox4";
		this.TextBox4.Size = new System.Drawing.Size(57, 20);
		this.TextBox4.TabIndex = 1;
		this.TextBox6.BackColor = System.Drawing.Color.Yellow;
		this.TextBox6.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.TextBox6.Font = new System.Drawing.Font("Microsoft Sans Serif", 9f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.TextBox6.Location = new System.Drawing.Point(9, 87);
		this.TextBox6.Multiline = true;
		this.TextBox6.Name = "TextBox6";
		this.TextBox6.ReadOnly = true;
		this.TextBox6.Size = new System.Drawing.Size(615, 39);
		this.TextBox6.TabIndex = 2;
		this.TextBox6.Text = resources.GetString("TextBox6.Text");
		this.TextBox7.BackColor = System.Drawing.Color.White;
		this.TextBox7.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.TextBox7.Font = new System.Drawing.Font("Microsoft Sans Serif", 9f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.TextBox7.Location = new System.Drawing.Point(9, 132);
		this.TextBox7.Multiline = true;
		this.TextBox7.Name = "TextBox7";
		this.TextBox7.ReadOnly = true;
		this.TextBox7.Size = new System.Drawing.Size(615, 53);
		this.TextBox7.TabIndex = 2;
		this.TextBox7.Text = resources.GetString("TextBox7.Text");
		this.PictureBox1.Image = (System.Drawing.Image)resources.GetObject("PictureBox1.Image");
		this.PictureBox1.Location = new System.Drawing.Point(117, 46);
		this.PictureBox1.Name = "PictureBox1";
		this.PictureBox1.Size = new System.Drawing.Size(396, 34);
		this.PictureBox1.TabIndex = 3;
		this.PictureBox1.TabStop = false;
		this.GroupBox1.Controls.Add(this.PictureBox1);
		this.GroupBox1.Controls.Add(this.TextBox7);
		this.GroupBox1.Controls.Add(this.TextBox6);
		this.GroupBox1.Controls.Add(this.TextBox4);
		this.GroupBox1.Controls.Add(this.Label4);
		this.GroupBox1.Controls.Add(this.TextBox3);
		this.GroupBox1.Controls.Add(this.Label3);
		this.GroupBox1.Controls.Add(this.TextBox2);
		this.GroupBox1.Controls.Add(this.Label2);
		this.GroupBox1.Controls.Add(this.TextBox1);
		this.GroupBox1.Controls.Add(this.Label1);
		this.GroupBox1.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25f, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, 0);
		this.GroupBox1.Location = new System.Drawing.Point(12, 12);
		this.GroupBox1.Name = "GroupBox1";
		this.GroupBox1.Size = new System.Drawing.Size(630, 194);
		this.GroupBox1.TabIndex = 1;
		this.GroupBox1.TabStop = false;
		this.GroupBox1.Text = "Niveles de Alarma";
		this.GroupBox2.Controls.Add(this.TextBox9);
		this.GroupBox2.Controls.Add(this.TextBox8);
		this.GroupBox2.Controls.Add(this.Label6);
		this.GroupBox2.Controls.Add(this.TextBox5);
		this.GroupBox2.Controls.Add(this.Label5);
		this.GroupBox2.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25f, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, 0);
		this.GroupBox2.Location = new System.Drawing.Point(12, 212);
		this.GroupBox2.Name = "GroupBox2";
		this.GroupBox2.Size = new System.Drawing.Size(629, 72);
		this.GroupBox2.TabIndex = 2;
		this.GroupBox2.TabStop = false;
		this.GroupBox2.Text = "Filtros de Sensores";
		this.TextBox9.BackColor = System.Drawing.Color.White;
		this.TextBox9.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
		this.TextBox9.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.TextBox9.Location = new System.Drawing.Point(207, 19);
		this.TextBox9.Multiline = true;
		this.TextBox9.Name = "TextBox9";
		this.TextBox9.ReadOnly = true;
		this.TextBox9.Size = new System.Drawing.Size(416, 47);
		this.TextBox9.TabIndex = 4;
		this.TextBox9.Text = resources.GetString("TextBox9.Text");
		this.TextBox8.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.TextBox8.Location = new System.Drawing.Point(154, 45);
		this.TextBox8.MaxLength = 4;
		this.TextBox8.Name = "TextBox8";
		this.TextBox8.Size = new System.Drawing.Size(47, 20);
		this.TextBox8.TabIndex = 1;
		this.Label6.AutoSize = true;
		this.Label6.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.Label6.Location = new System.Drawing.Point(53, 48);
		this.Label6.Name = "Label6";
		this.Label6.Size = new System.Drawing.Size(95, 13);
		this.Label6.TabIndex = 0;
		this.Label6.Text = "Filtro de Giróscopo";
		this.TextBox5.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.TextBox5.Location = new System.Drawing.Point(154, 19);
		this.TextBox5.MaxLength = 4;
		this.TextBox5.Name = "TextBox5";
		this.TextBox5.Size = new System.Drawing.Size(47, 20);
		this.TextBox5.TabIndex = 1;
		this.Label5.AutoSize = true;
		this.Label5.Font = new System.Drawing.Font("Microsoft Sans Serif", 8.25f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.Label5.Location = new System.Drawing.Point(39, 22);
		this.Label5.Name = "Label5";
		this.Label5.Size = new System.Drawing.Size(109, 13);
		this.Label5.TabIndex = 0;
		this.Label5.Text = "Filtro de Acelerómetro";
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 13f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(651, 320);
		base.Controls.Add(this.GroupBox2);
		base.Controls.Add(this.GroupBox1);
		base.Controls.Add(this.Button2);
		base.Controls.Add(this.Button1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.Fixed3D;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "Config_avanzada";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "Configuración Avanzada";
		((System.ComponentModel.ISupportInitialize)this.PictureBox1).EndInit();
		this.GroupBox1.ResumeLayout(false);
		this.GroupBox1.PerformLayout();
		this.GroupBox2.ResumeLayout(false);
		this.GroupBox2.PerformLayout();
		base.ResumeLayout(false);
	}

	private void Config_avanzada_FormClosing(object sender, FormClosingEventArgs e)
	{
		if (aceptar != 1)
		{
			return;
		}
		if (MyProject.Forms.Carga_Datos.config_avan == 1)
		{
			MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T11 = Conversions.ToString(Conversions.ToInteger(TextBox1.Text));
			MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T21 = Conversions.ToString(Conversions.ToInteger(TextBox2.Text));
			MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T31 = Conversions.ToString(Conversions.ToInteger(TextBox3.Text));
			MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T41 = Conversions.ToString(Conversions.ToInteger(TextBox4.Text));
			if (MyProject.Forms.Principal.user == 0)
			{
				MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].KA1 = TextBox5.Text;
				MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].KG1 = TextBox8.Text;
			}
		}
		else
		{
			MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T12 = Conversions.ToString(Conversions.ToInteger(TextBox1.Text));
			MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T22 = Conversions.ToString(Conversions.ToInteger(TextBox2.Text));
			MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T32 = Conversions.ToString(Conversions.ToInteger(TextBox3.Text));
			MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T42 = Conversions.ToString(Conversions.ToInteger(TextBox4.Text));
			if (MyProject.Forms.Principal.user == 0)
			{
				MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].KA2 = TextBox5.Text;
				MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].KG2 = TextBox8.Text;
			}
		}
	}

	private void Config_avanzada_Load(object sender, EventArgs e)
	{
		Text = frases.ResourceManager.GetString("configavanzada");
		GroupBox1.Text = frases.ResourceManager.GetString("nivelesdealarma");
		TextBox6.Text = frases.ResourceManager.GetString("tb6");
		TextBox7.Text = frases.ResourceManager.GetString("tb7");
		GroupBox2.Text = frases.ResourceManager.GetString("filtrosdesensores");
		Label5.Text = frases.ResourceManager.GetString("filtrodeacelerometro");
		Label6.Text = frases.ResourceManager.GetString("filtrodegiroscopo");
		TextBox9.Text = frases.ResourceManager.GetString("tb9");
		if (MyProject.Forms.Carga_Datos.config_avan == 1)
		{
			TextBox1.Text = MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T11;
			TextBox2.Text = MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T21;
			TextBox3.Text = MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T31;
			TextBox4.Text = MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T41;
			if (MyProject.Forms.Principal.user == 0)
			{
				TextBox5.Text = Conversions.ToString(Conversions.ToSingle(MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].KA1));
				TextBox8.Text = Conversions.ToString(Conversions.ToSingle(MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].KG1));
			}
		}
		else
		{
			TextBox1.Text = MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T12;
			TextBox2.Text = MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T22;
			TextBox3.Text = MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T32;
			TextBox4.Text = MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].T42;
			if (MyProject.Forms.Principal.user == 0)
			{
				TextBox5.Text = Conversions.ToString(Conversions.ToSingle(MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].KA2));
				TextBox8.Text = Conversions.ToString(Conversions.ToSingle(MyProject.Forms.Carga_Datos.VehiculosDataSet.RG[MyProject.Forms.Carga_Datos.RGBindingSource2.Position].KG2));
			}
		}
		if ((MyProject.Forms.Principal.user == 1) | (MyProject.Forms.Principal.user == 2))
		{
			GroupBox2.Enabled = false;
		}
	}

	private void Button2_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		if ((Conversions.ToInteger(TextBox1.Text) >= 90) | (Conversions.ToInteger(TextBox1.Text) < Conversions.ToInteger(TextBox2.Text)) | (Conversions.ToInteger(TextBox2.Text) < Conversions.ToInteger(TextBox3.Text)) | (Conversions.ToInteger(TextBox3.Text) < Conversions.ToInteger(TextBox4.Text)))
		{
			MessageBox.Show("Hay un problema con los valores de los intervalos." + Environment.NewLine + "Por favor, revisa que se encuentren en orden decreciente.", "Error");
			return;
		}
		aceptar = 1;
		Close();
	}

	private void TextBox1_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == Convert.ToChar(8))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(57)) & (e.KeyChar >= Convert.ToChar(48)))
		{
			e.Handled = false;
		}
		else
		{
			e.Handled = true;
		}
	}

	private void TextBox2_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == Convert.ToChar(8))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(57)) & (e.KeyChar >= Convert.ToChar(48)))
		{
			e.Handled = false;
		}
		else
		{
			e.Handled = true;
		}
	}

	private void TextBox3_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == Convert.ToChar(8))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(57)) & (e.KeyChar >= Convert.ToChar(48)))
		{
			e.Handled = false;
		}
		else
		{
			e.Handled = true;
		}
	}

	private void TextBox4_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == Convert.ToChar(8))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(57)) & (e.KeyChar >= Convert.ToChar(48)))
		{
			e.Handled = false;
		}
		else
		{
			e.Handled = true;
		}
	}

	private void TextBox5_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == Convert.ToChar(8))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(57)) & (e.KeyChar >= Convert.ToChar(48)))
		{
			e.Handled = false;
		}
		else if (e.KeyChar == Convert.ToChar(44))
		{
			e.Handled = false;
		}
		else if (e.KeyChar == Convert.ToChar(46))
		{
			e.Handled = false;
		}
		else
		{
			e.Handled = true;
		}
	}

	private void TextBox8_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == Convert.ToChar(8))
		{
			e.Handled = false;
		}
		else if ((e.KeyChar <= Convert.ToChar(57)) & (e.KeyChar >= Convert.ToChar(48)))
		{
			e.Handled = false;
		}
		else if (e.KeyChar == Convert.ToChar(44))
		{
			e.Handled = false;
		}
		else if (e.KeyChar == Convert.ToChar(46))
		{
			e.Handled = false;
		}
		else
		{
			e.Handled = true;
		}
	}
}
