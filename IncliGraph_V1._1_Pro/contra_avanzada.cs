using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.My;
using Microsoft.VisualBasic;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class contra_avanzada : Form
{
	private IContainer components;

	[CompilerGenerated]
	[AccessedThroughProperty("Button1")]
	private Button _Button1;

	[CompilerGenerated]
	[AccessedThroughProperty("Button2")]
	private Button _Button2;

	private int clave;

	private string contra_system;

	private string dia_cont;

	private string mes_cont;

	[field: AccessedThroughProperty("Label1")]
	internal virtual Label Label1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("TextBox1")]
	internal virtual TextBox TextBox1
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

	public contra_avanzada()
	{
		base.Load += contra_avanzada_Load;
		clave = 0;
		checked
		{
			dia_cont = Conversions.ToString(2 * DateTime.Today.Day);
			mes_cont = Conversions.ToString(2 * DateTime.Today.Month);
			InitializeComponent();
		}
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
		this.TextBox1 = new System.Windows.Forms.TextBox();
		this.Button1 = new System.Windows.Forms.Button();
		this.Button2 = new System.Windows.Forms.Button();
		base.SuspendLayout();
		this.Label1.AutoSize = true;
		this.Label1.Location = new System.Drawing.Point(12, 9);
		this.Label1.Name = "Label1";
		this.Label1.Size = new System.Drawing.Size(235, 13);
		this.Label1.TabIndex = 0;
		this.Label1.Text = "Por favor, introduzca contraseña para continuar:";
		this.TextBox1.Location = new System.Drawing.Point(15, 34);
		this.TextBox1.Name = "TextBox1";
		this.TextBox1.Size = new System.Drawing.Size(232, 20);
		this.TextBox1.TabIndex = 1;
		this.TextBox1.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
		this.TextBox1.UseSystemPasswordChar = true;
		this.Button1.Location = new System.Drawing.Point(172, 60);
		this.Button1.Name = "Button1";
		this.Button1.Size = new System.Drawing.Size(75, 23);
		this.Button1.TabIndex = 2;
		this.Button1.Text = "Aceptar";
		this.Button1.UseVisualStyleBackColor = true;
		this.Button2.Location = new System.Drawing.Point(15, 60);
		this.Button2.Name = "Button2";
		this.Button2.Size = new System.Drawing.Size(75, 23);
		this.Button2.TabIndex = 2;
		this.Button2.Text = "Cancelar";
		this.Button2.UseVisualStyleBackColor = true;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 13f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(262, 92);
		base.Controls.Add(this.Button2);
		base.Controls.Add(this.Button1);
		base.Controls.Add(this.TextBox1);
		base.Controls.Add(this.Label1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "contra_avanzada";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "Introducir Contraseña";
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void Button2_Click(object sender, EventArgs e)
	{
		Close();
	}

	private void Button1_Click(object sender, EventArgs e)
	{
		if (Operators.CompareString(TextBox1.Text, contra_system, TextCompare: false) == 0)
		{
			Close();
			MyProject.Forms.Carga_Datos.Show();
			MyProject.Forms.Principal.Visible = false;
		}
		else
		{
			Interaction.MsgBox("Contraseña incorrecta.", MsgBoxStyle.OkOnly, "Error");
		}
	}

	private void contra_avanzada_Load(object sender, EventArgs e)
	{
		contra_system = dia_cont + mes_cont;
	}
}
