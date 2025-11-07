using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.My;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class importacion : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	[field: AccessedThroughProperty("Label1")]
	internal virtual Label Label1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label2")]
	internal virtual Label Label2
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label3")]
	internal virtual Label Label3
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label4")]
	internal virtual Label Label4
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label5")]
	internal virtual Label Label5
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

	[field: AccessedThroughProperty("Label6")]
	internal virtual Label Label6
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label7")]
	internal virtual Label Label7
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("Label8")]
	internal virtual Label Label8
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	public importacion()
	{
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
		this.Label1 = new System.Windows.Forms.Label();
		this.Label2 = new System.Windows.Forms.Label();
		this.Label3 = new System.Windows.Forms.Label();
		this.Label4 = new System.Windows.Forms.Label();
		this.Label5 = new System.Windows.Forms.Label();
		this.Button1 = new System.Windows.Forms.Button();
		this.Button2 = new System.Windows.Forms.Button();
		this.Label6 = new System.Windows.Forms.Label();
		this.Label7 = new System.Windows.Forms.Label();
		this.Label8 = new System.Windows.Forms.Label();
		base.SuspendLayout();
		this.Label1.AutoSize = true;
		this.Label1.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.Label1.Location = new System.Drawing.Point(12, 9);
		this.Label1.Name = "Label1";
		this.Label1.Size = new System.Drawing.Size(401, 32);
		this.Label1.TabIndex = 0;
		this.Label1.Text = "Para importar un listado de vehículos correctamente es necesario \r\ncumplir los siguientes requisitos:";
		this.Label2.AutoSize = true;
		this.Label2.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.Label2.Location = new System.Drawing.Point(12, 49);
		this.Label2.Name = "Label2";
		this.Label2.Size = new System.Drawing.Size(566, 16);
		this.Label2.TabIndex = 1;
		this.Label2.Text = "- El listado de vehículos debe estar en formato neutro .csv (campos delimitados por comas \";\")";
		this.Label3.AutoSize = true;
		this.Label3.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.Label3.Location = new System.Drawing.Point(12, 71);
		this.Label3.Name = "Label3";
		this.Label3.Size = new System.Drawing.Size(578, 16);
		this.Label3.TabIndex = 1;
		this.Label3.Text = "- Los datos de cada vehículo, organizados por columnas, deben aparecer en el siguiente orden:";
		this.Label4.AutoSize = true;
		this.Label4.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75f, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, 0);
		this.Label4.Location = new System.Drawing.Point(33, 95);
		this.Label4.Name = "Label4";
		this.Label4.Size = new System.Drawing.Size(587, 16);
		this.Label4.TabIndex = 1;
		this.Label4.Text = "Número de Bastidor ; Nombre Cliente ; Marca Vehículo ; Modelo Vehículo ; Matrícula";
		this.Label5.AutoSize = true;
		this.Label5.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.Label5.Location = new System.Drawing.Point(12, 172);
		this.Label5.Name = "Label5";
		this.Label5.Size = new System.Drawing.Size(599, 32);
		this.Label5.TabIndex = 0;
		this.Label5.Text = "- El archivo no debe tener cabecera alguna, es decir, la primera fila de la lista corresponderá con el \r\n   primer vehículo de la misma.";
		this.Button1.Location = new System.Drawing.Point(430, 239);
		this.Button1.Name = "Button1";
		this.Button1.Size = new System.Drawing.Size(199, 33);
		this.Button1.TabIndex = 2;
		this.Button1.Text = "Importar Listado de Vehículos";
		this.Button1.UseVisualStyleBackColor = true;
		this.Button2.Location = new System.Drawing.Point(15, 239);
		this.Button2.Name = "Button2";
		this.Button2.Size = new System.Drawing.Size(75, 33);
		this.Button2.TabIndex = 2;
		this.Button2.Text = "Cancelar";
		this.Button2.UseVisualStyleBackColor = true;
		this.Label6.AutoSize = true;
		this.Label6.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.Label6.Location = new System.Drawing.Point(12, 213);
		this.Label6.Name = "Label6";
		this.Label6.Size = new System.Drawing.Size(617, 16);
		this.Label6.TabIndex = 0;
		this.Label6.Text = "Si ha verificado que el listado cumple con estos requisitos, haga click en Importar Listado de Vehículos";
		this.Label7.AutoSize = true;
		this.Label7.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.Label7.Location = new System.Drawing.Point(33, 117);
		this.Label7.Name = "Label7";
		this.Label7.Size = new System.Drawing.Size(84, 16);
		this.Label7.TabIndex = 3;
		this.Label7.Text = "Por ejemplo:";
		this.Label8.AutoSize = true;
		this.Label8.Font = new System.Drawing.Font("Microsoft Sans Serif", 9.75f, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, 0);
		this.Label8.Location = new System.Drawing.Point(33, 138);
		this.Label8.Name = "Label8";
		this.Label8.Size = new System.Drawing.Size(326, 16);
		this.Label8.TabIndex = 3;
		this.Label8.Text = "2355332074844 ; UEI XXX ; VOLVO ;  580FE; 1234-ABC";
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 13f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(641, 295);
		base.Controls.Add(this.Label8);
		base.Controls.Add(this.Label7);
		base.Controls.Add(this.Button2);
		base.Controls.Add(this.Button1);
		base.Controls.Add(this.Label4);
		base.Controls.Add(this.Label3);
		base.Controls.Add(this.Label2);
		base.Controls.Add(this.Label6);
		base.Controls.Add(this.Label5);
		base.Controls.Add(this.Label1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "importacion";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "Asistente de importación";
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void Button2_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		MyProject.Forms.Base_Datos_Vehiculos.ImportarCSV();
		Close();
	}
}
